import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  CreditCard,
  IdCard,
  Loader2,
  MapPin,
  Phone,
  Save,
  Star,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useProfile,
  useUpdateProfile,
  useWalletBalance,
} from "../hooks/useQueries";
import { formatINR } from "../utils/format";

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useProfile();
  const { data: balance = 0n } = useWalletBalance();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [aadharOrStudentId, setAadharOrStudentId] = useState("");

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setLocation(profile.location ?? "");
      setIsAvailable(profile.isAvailableAsTasker ?? false);
      setUpiId((profile as any).upiId ?? "");
      setAadharOrStudentId((profile as any).aadharOrStudentId ?? "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      name,
      phone: phone || null,
      location,
      isAvailableAsTasker: isAvailable,
      upiId: upiId || null,
      aadharOrStudentId: aadharOrStudentId || null,
    });
  };

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal =
    principal.length > 20
      ? `${principal.slice(0, 10)}\u2026${principal.slice(-6)}`
      : principal;

  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TT";

  const isFormValid = !!name && !!location;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display font-black text-3xl sm:text-4xl">
          Your <span className="text-green-gradient">Profile</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and tasker settings
        </p>
      </motion.div>

      {/* Profile summary card */}
      {isLoading ? (
        <Skeleton className="h-32 rounded-2xl bg-secondary" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-5 border-border flex items-center gap-4"
        >
          <Avatar className="w-16 h-16 rounded-2xl">
            <AvatarFallback className="bg-green-surface text-green-vivid font-display font-bold text-xl rounded-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-lg truncate">
              {name || "Task Turtle User"}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
              {shortPrincipal}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold">
                  {profile?.rating
                    ? (Number(profile.rating) / 10).toFixed(1)
                    : "5.0"}
                </span>
              </div>
              <span className="text-border">•</span>
              <Badge
                className={
                  isAvailable
                    ? "bg-green-surface text-green-vivid border-0 text-xs"
                    : "bg-secondary text-muted-foreground border-0 text-xs"
                }
              >
                {isAvailable ? "Available" : "Offline"}
              </Badge>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Wallet className="w-3 h-3" />
                <span>{formatINR(balance)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card border-border rounded-3xl shadow-card">
          <CardHeader>
            <CardTitle className="font-display font-bold text-xl">
              Edit Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-sm font-semibold">
                  <User className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                  Full Name *
                </Label>
                <Input
                  id="profile-name"
                  data-ocid="profile.name_input"
                  placeholder="e.g., Arjun Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="profile-phone"
                  className="text-sm font-semibold"
                >
                  <Phone className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                  Phone Number
                  <span className="text-muted-foreground font-normal ml-1">
                    — optional
                  </span>
                </Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  placeholder="e.g., +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
                />
              </div>

              {/* UPI ID */}
              <div className="space-y-2">
                <Label htmlFor="profile-upi" className="text-sm font-semibold">
                  <CreditCard className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                  UPI ID
                  <span className="text-muted-foreground font-normal ml-1">
                    — optional
                  </span>
                </Label>
                <Input
                  id="profile-upi"
                  data-ocid="profile.upi_input"
                  placeholder="e.g., name@upi or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
                />
              </div>

              {/* Aadhar / Student ID */}
              <div className="space-y-2">
                <Label
                  htmlFor="profile-aadhar"
                  className="text-sm font-semibold"
                >
                  <IdCard className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                  Aadhar No. / Student ID
                  <span className="text-muted-foreground font-normal ml-1">
                    — optional
                  </span>
                </Label>
                <Input
                  id="profile-aadhar"
                  data-ocid="profile.aadhar_input"
                  placeholder="e.g., 1234 5678 9012 or STUDENT-001"
                  value={aadharOrStudentId}
                  onChange={(e) => setAadharOrStudentId(e.target.value)}
                  className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label
                  htmlFor="profile-location"
                  className="text-sm font-semibold"
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                  Your Location *
                </Label>
                <Input
                  id="profile-location"
                  placeholder="e.g., Sector 62, Noida, UP"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
                />
              </div>

              {/* Tasker availability */}
              <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isAvailable ? "bg-green-surface" : "bg-secondary"}`}
                    >
                      <Zap
                        className={`w-4.5 h-4.5 transition-colors ${isAvailable ? "text-green-vivid" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        Available as Tasker
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        When ON, you'll receive nearby task requests
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={(val) => {
                      setIsAvailable(val);
                    }}
                    data-ocid="profile.availability_switch"
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                data-ocid="profile.save_button"
                disabled={updateProfile.isPending || !isFormValid}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6 shadow-green-sm hover:shadow-green-md transition-all rounded-2xl"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving\u2026
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Principal info */}
      {principal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-4 border-border"
        >
          <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">
            Your Internet Identity Principal
          </p>
          <p className="font-mono text-xs text-foreground break-all leading-relaxed">
            {principal}
          </p>
        </motion.div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        \u00a9 {new Date().getFullYear()} Task Turtle. All rights reserved.
      </p>
    </div>
  );
}
