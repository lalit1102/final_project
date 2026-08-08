"use client";

import { useEffect } from "react";
import { Typography } from "antd";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { useAuth } from "@/hooks";

const { Title, Paragraph } = Typography;

export default function DashboardPage() {

  const {
    user,
    profile,
    loading,
    logout
  } = useAuth();


 useEffect(() => {
   const loadProfile = async () => {
     await profile();
   };

   loadProfile();
 }, [profile]);


  if (loading) {
    return null;
  }


  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>
          Dashboard
        </Title>

        <Paragraph>
          You have successfully signed in to your account.
        </Paragraph>


        {user && (
          <>
            <p>
              Name: {user.name}
            </p>

            <p>
              Email: {user.email}
            </p>

            <p>
              Role: {user.role}
            </p>
          </>
        )}
        <Button
          type="primary"
          onClick={logout}
        >
          Logout
        </Button>

      </Card>
    </div>
  );
}