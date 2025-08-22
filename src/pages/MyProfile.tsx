import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { profileService, UserProfile } from '@/services/profileService';
import { Loader2, Camera, Save, User, Mail, Phone, MapPin, Building, Briefcase, Clock } from 'lucide-react';

const MyProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { user } = useImprovedAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    department: '',
    job_title: '',
    location: '',
    timezone: 'UTC',
    notification_preferences: {
      email: true,
      push: true,
      chat: true
    }
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getCurrentProfile();
      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          bio: profileData.bio || '',
          department: profileData.department || '',
          job_title: profileData.job_title || '',
          location: profileData.location || '',
          timezone: profileData.timezone || 'UTC',
          notification_preferences: profileData.notification_preferences || {
            email: true,
            push: true,
            chat: true
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (type: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [type]: enabled
      }
    }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const avatarUrl = await profileService.uploadAvatar(file);
      if (avatarUrl) {
        await profileService.updateProfile({ avatar_url: avatarUrl });
        setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
        toast({
          title: "Success",
          description: "Profile picture updated successfully"
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await profileService.updateProfile(formData);
      await loadProfile();
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <header className="mb-8 text-center lg:text-left">
          <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-300 text-lg">Manage your personal information and preferences</p>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Picture Section - Left Column */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-fit sticky top-8">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Profile Picture</CardTitle>
                <CardDescription className="text-gray-300">Upload your avatar</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <Avatar className="w-32 h-32 border-4 border-white/20 shadow-lg">
                    <AvatarImage 
                      src={profile?.avatar_url} 
                      alt={profile?.full_name || "Profile picture"}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {profile?.full_name ? getInitials(profile.full_name) : <User className="w-12 h-12" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <label 
                    className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 cursor-pointer transition-all duration-200 shadow-lg group-hover:scale-110"
                    aria-label="Upload new profile picture"
                  >
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="sr-only"
                      disabled={uploadingAvatar}
                      aria-describedby="avatar-upload-help"
                    />
                  </label>
                </div>
                
                <div id="avatar-upload-help" className="text-center">
                  {uploadingAvatar ? (
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Click the camera icon to upload</p>
                  )}
                </div>

                {/* Profile Summary */}
                <div className="w-full text-center space-y-2 pt-4 border-t border-white/20">
                  <h3 className="text-lg font-semibold text-white">
                    {profile?.full_name || 'User Name'}
                  </h3>
                  {profile?.job_title && (
                    <p className="text-sm text-gray-300 flex items-center justify-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {profile.job_title}
                    </p>
                  )}
                  {profile?.department && (
                    <p className="text-sm text-gray-300 flex items-center justify-center gap-2">
                      <Building className="w-4 h-4" />
                      {profile.department}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Form Section - Right Columns */}
          <div className="lg:col-span-3 space-y-8">
            {/* Personal Information */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-white flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                      aria-describedby="full_name-help"
                    />
                    <p id="full_name-help" className="text-xs text-gray-400">
                      This will be displayed across the platform
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="job_title" className="text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Job Title
                    </Label>
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      placeholder="Your job title"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-white flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Department
                    </Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Your department"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Your location"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-white flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Timezone
                    </Label>
                    <Input
                      id="timezone"
                      value={formData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      placeholder="UTC"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    />
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <Label htmlFor="bio" className="text-white">About Me</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={4}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 resize-none"
                    aria-describedby="bio-help"
                  />
                  <p id="bio-help" className="text-xs text-gray-400">
                    Share a brief description about yourself (optional)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Mail className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Choose how you want to be notified about important updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="space-y-1">
                      <Label 
                        htmlFor="email-notifications" 
                        className="text-white font-medium cursor-pointer"
                      >
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-400">
                        Receive important updates and alerts via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={formData.notification_preferences.email}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                      aria-describedby="email-notifications-help"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="space-y-1">
                      <Label 
                        htmlFor="push-notifications" 
                        className="text-white font-medium cursor-pointer"
                      >
                        Push Notifications
                      </Label>
                      <p className="text-sm text-gray-400">
                        Get instant browser notifications for urgent matters
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={formData.notification_preferences.push}
                      onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="space-y-1">
                      <Label 
                        htmlFor="chat-notifications" 
                        className="text-white font-medium cursor-pointer"
                      >
                        Chat Notifications
                      </Label>
                      <p className="text-sm text-gray-400">
                        Be notified about new chat messages and support updates
                      </p>
                    </div>
                    <Switch
                      id="chat-notifications"
                      checked={formData.notification_preferences.chat}
                      onCheckedChange={(checked) => handleNotificationChange('chat', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button Section */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                aria-describedby="save-button-help"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
            <p id="save-button-help" className="text-xs text-gray-400 text-right mt-2">
              All changes will be saved to your profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;