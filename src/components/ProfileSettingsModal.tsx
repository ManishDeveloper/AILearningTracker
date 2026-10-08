import { useState } from "react";
import {
  Alert,
  Button,
  Divider,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import type { FormEvent } from "react";
import { toAppUser } from "../data/users";
import type { User } from "../data/users";
import { notifyLeaderboardUpdated } from "../leaderboardEvents";
import { getErrorMessage } from "../storage";
import { supabase } from "../supabase";

export default function ProfileSettingsModal({
  opened,
  user,
  onClose,
  onUserUpdated,
  onResetRoadmap,
}: {
  opened: boolean;
  user: User;
  onClose: () => void;
  onUserUpdated?: (user: User) => void;
  onResetRoadmap: () => Promise<boolean>;
}) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  async function updateDisplayName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = displayName.trim();
    setNameError("");
    setNameSuccess("");

    if (!nextName) {
      setNameError("Display name cannot be empty.");
      return;
    }
    if (!supabase) {
      setNameError("Supabase is not configured.");
      return;
    }

    setSavingName(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: nextName },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Unable to load the updated account.");

      const updatedUser = toAppUser(data.user);

      const { error: leaderboardError } = await supabase
        .from("user_leaderboard")
        .upsert(
          {
            user_id: user.id,
            display_name: updatedUser.displayName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      notifyLeaderboardUpdated();
      setNameSuccess(
        leaderboardError
          ? "Display name updated. The leaderboard name could not be refreshed yet."
          : "Display name updated.",
      );
      if (typeof onUserUpdated === "function") {
        onUserUpdated(updatedUser);
      } else {
        window.location.reload();
      }
    } catch (error: unknown) {
      setNameError(getErrorMessage(error, "Unable to update display name."));
    } finally {
      setSavingName(false);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (!supabase) {
      setPasswordError("Supabase is not configured.");
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated.");
    } catch (error: unknown) {
      setPasswordError(getErrorMessage(error, "Unable to update password."));
    } finally {
      setSavingPassword(false);
    }
  }

  async function confirmRoadmapReset() {
    setResetError("");
    setResetSuccess("");
    setResetting(true);
    try {
      const saved = await onResetRoadmap();
      if (!saved) {
        setResetError("Could not save the reset. Please try again.");
        return;
      }
      setResetConfirmationOpen(false);
      setResetSuccess(
        "Roadmap progress and topic timers reset. Projects and resources were kept.",
      );
    } finally {
      setResetting(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Profile settings"
      centered
      size="md"
    >
      <Stack gap="lg">
        <form className="profile-settings-form" onSubmit={updateDisplayName}>
          <TextInput
            label="Display name"
            value={displayName}
            onChange={(event) => setDisplayName(event.currentTarget.value)}
            maxLength={50}
            autoComplete="name"
            required
          />
          {nameError && <Alert color="red">{nameError}</Alert>}
          {nameSuccess && <Alert color="teal">{nameSuccess}</Alert>}
          <Group justify="flex-end">
            <Button type="submit" loading={savingName}>
              Update name
            </Button>
          </Group>
        </form>

        <Divider />

        <form className="profile-settings-form" onSubmit={updatePassword}>
          <PasswordInput
            label="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.currentTarget.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
          <PasswordInput
            label="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            autoComplete="new-password"
            required
          />
          {passwordError && <Alert color="red">{passwordError}</Alert>}
          {passwordSuccess && <Alert color="teal">{passwordSuccess}</Alert>}
          <Group justify="flex-end">
            <Button type="submit" loading={savingPassword}>
              Update password
            </Button>
          </Group>
        </form>

        <Divider />

        <Stack gap="xs">
          <Text fw={600}>Reset roadmap progress</Text>
          <Text size="sm" c="dimmed">
            Clears topic statuses, timers, and completion points. Projects and
            resources stay untouched.
          </Text>
          {resetError && <Alert color="red">{resetError}</Alert>}
          {resetSuccess && <Alert color="teal">{resetSuccess}</Alert>}
          <Group justify="flex-end">
            <Button
              color="red"
              variant="light"
              onClick={() => setResetConfirmationOpen(true)}
            >
              Reset roadmap
            </Button>
          </Group>
        </Stack>
      </Stack>
      <Modal
        opened={resetConfirmationOpen}
        onClose={() => setResetConfirmationOpen(false)}
        title="Reset roadmap progress?"
        centered
        size="sm"
        closeOnClickOutside={!resetting}
        closeOnEscape={!resetting}
      >
        <Stack gap="md">
          <Alert color="orange">
            All topic statuses and timers will reset. You will lose the points
            earned for each completed topic. Your projects and resources will
            remain.
          </Alert>
          {resetError && <Alert color="red">{resetError}</Alert>}
          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={resetting}
              onClick={() => setResetConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={resetting}
              onClick={() => void confirmRoadmapReset()}
            >
              Reset progress
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Modal>
  );
}
