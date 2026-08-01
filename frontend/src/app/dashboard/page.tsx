"use client";

import { useEffect, useState } from "react";
import { Typography } from "antd";
import { Card } from "@/components/card";
import { isAuthenticated } from "@/utils/auth";

const { Title, Paragraph } = Typography;

export default function DashboardPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      const authenticated = await isAuthenticated();
      setReady(authenticated);
    };

    void verifyAccess();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>Dashboard</Title>
        <Paragraph>You have successfully signed in to your account.</Paragraph>
      </Card>
    </div>
  );
}
