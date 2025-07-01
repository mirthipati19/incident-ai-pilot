
import { useState } from "react";

export const useSmartAgent = () => {
  const [approved, setApproved] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const agentUrl = "http://localhost:5123";

  const requestApproval = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch(`${agentUrl}/approve`, { method: "POST" });
      if (res.ok) {
        setApproved(true);
        console.log("✅ User approved connection.");
      }
    } catch (error) {
      console.error("❌ Failed to connect to local agent:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const sendCommand = async (cmd: string) => {
    if (!approved) throw new Error("Connection not approved");

    const res = await fetch(`${agentUrl}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: cmd }),
    });

    if (!res.ok) {
      throw new Error(`Command failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.output;
  };

  return { approved, isConnecting, requestApproval, sendCommand };
};
