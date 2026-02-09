"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { ProviderProfile, ApiKeyInfo } from "@humanlayer/shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/hooks/use-auth";

interface ProfileForm {
  businessName: string;
  description: string;
  websiteUrl: string;
}

export default function ProviderSettingsPage() {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingWallet, setIsUpdatingWallet] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const { register, handleSubmit, reset } = useForm<ProfileForm>();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const profileRes = await api.get<ProviderProfile>(
          "/provider/profile",
        );
        setProfile(profileRes.data);
        reset({
          businessName: profileRes.data.businessName,
          description: profileRes.data.description ?? "",
          websiteUrl: profileRes.data.websiteUrl ?? "",
        });
        try {
          const keysRes = await api.get<ApiKeyInfo[]>("/auth/api-keys");
          setApiKeys(keysRes.data);
        } catch {
          // May not exist yet
        }
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [reset]);

  const onSubmitProfile = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      await api.patch("/provider/profile", data);
      toast("Profile updated!", "success");
    } catch {
      toast("Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyLabel.trim()) return;
    try {
      const res = await api.post<{ key: string; info: ApiKeyInfo }>(
        "/auth/api-keys",
        { label: newKeyLabel },
      );
      toast(`API key created: ${res.data.key}`, "success");
      setNewKeyLabel("");
      setApiKeys((prev) => [...prev, res.data.info]);
    } catch {
      toast("Failed to create API key", "error");
    }
  };

  const handleUpdateWalletAddress = async () => {
    if (!address) return;
    setIsUpdatingWallet(true);
    try {
      await api.patch("/auth/me", { walletAddress: address });
      toast("Wallet address saved!", "success");
    } catch (error) {
      console.error("Failed to update wallet:", error);
      toast("Failed to save wallet address", "error");
    } finally {
      setIsUpdatingWallet(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Provider Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmitProfile)}
            className="space-y-4"
          >
            <Input
              id="businessName"
              label="Business Name"
              {...register("businessName", { required: true })}
            />
            <Textarea
              id="description"
              label="Description"
              {...register("description")}
            />
            <Input
              id="websiteUrl"
              label="Website URL"
              type="url"
              {...register("websiteUrl")}
            />
            {profile && (
              <div className="text-sm text-gray-500">
                <p>
                  Verification:{" "}
                  <span className="font-medium">
                    {profile.verificationStatus}
                  </span>
                </p>
                <p>
                  Total Reviews:{" "}
                  <span className="font-medium">{profile.totalReviews}</span>
                </p>
              </div>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your wallet to receive escrow payments. This address will be used when buyers deposit funds.
          </p>

          {user?.walletAddress ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-900 mb-1">Wallet Connected</p>
              <p className="font-mono text-xs text-green-700">{user.walletAddress}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm font-medium text-yellow-900 mb-1">No Wallet Connected</p>
              <p className="text-xs text-yellow-700">
                You must connect a wallet to receive payments from buyers.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <ConnectButton showBalance={false} />
            {isConnected && address && address !== user?.walletAddress && (
              <Button
                onClick={handleUpdateWalletAddress}
                disabled={isUpdatingWallet}
                size="sm"
              >
                {isUpdatingWallet ? "Saving..." : "Save Wallet Address"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeys.length > 0 ? (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key?.id}
                  className="flex items-center justify-between rounded border border-gray-200 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{key?.label}</p>
                    <p className="font-mono text-xs text-gray-400">
                      {key?.keyPrefix}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No API keys yet.</p>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Key label"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
            />
            <Button onClick={handleCreateApiKey}>Create Key</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
