import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Button } from "@/components/buttons"; // or default import if needed
import { useAppStore } from "@/store/useAppStore";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "@/constants/theme";
import { DISPOSAL_CATEGORIES } from '@/constants/disposal';

type SelectedImage = {
  uri: string;
  type: "photo" | "gallery";
} | null;

type StatCardProps = {
  icon: string;
  value: string;
  label: string;
};

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type RecentItemProps = {
  icon: string;
  name: string;
  category: string;
  onPress: () => void;
};

function RecentItem({ icon, name, category, onPress }: RecentItemProps) {
  return (
    <TouchableOpacity style={styles.recentItem} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.recentIcon}>{icon}</Text>
      <View style={styles.recentInfo}>
        <Text style={styles.recentName}>{name}</Text>
        <Text style={styles.recentCategory}>{category}</Text>
      </View>
      <Text style={styles.recentArrow}>→</Text>
    </TouchableOpacity>
  );
}

export default function Home() {
  const router = useRouter();

  const [itemText, setItemText] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<SelectedImage>(null);

  const user = useAppStore((s) => s.user);
  const setCurrentItem = useAppStore((s) => s.setCurrentItem);

  const canSubmit = useMemo(
    () => itemText.trim().length > 0 || selectedImage !== null,
    [itemText, selectedImage]
  );

  const handleTakePhoto = () => {
    const mockImage = {
      uri: "https://via.placeholder.com/400x300",
      type: "photo" as const,
    };
    setSelectedImage(mockImage);
    Alert.alert("Photo Captured", "Ready to analyze!");
  };

  const handlePickImage = () => {
    const mockImage = {
      uri: "https://via.placeholder.com/400x300",
      type: "gallery" as const,
    };
    setSelectedImage(mockImage);
    Alert.alert("Image Selected", "Ready to analyze!");
  };

  const handleSubmit = () => {
    if (!itemText.trim() && !selectedImage) {
      Alert.alert("No Item", "Please enter an item or take a photo");
      return;
    }

    // If your store expects (itemText, image), keep it:
    setCurrentItem(itemText || "Photo item", selectedImage);

    // Processing lives in (main)
    router.push("/(main)/processing");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name || "there"}! 👋</Text>
            <Text style={styles.subtitle}>What do you need to dispose of?</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.8}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <StatCard icon="♻️" value="42" label="Items Recycled" />
          <StatCard icon="🌱" value="8.2kg" label="CO₂ Saved" />
        </View>

        {/* Main Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Submit Your Item</Text>

          {/* Text Input */}
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type item name (e.g., plastic bottle, batteries)..."
              placeholderTextColor={COLORS.textLight}
              value={itemText}
              onChangeText={setItemText}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Image Input */}
          <View style={styles.imageSection}>
            {selectedImage ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageButtons}>
                <TouchableOpacity style={styles.imageButton} onPress={handleTakePhoto} activeOpacity={0.8}>
                  <Text style={styles.imageButtonIcon}>📸</Text>
                  <Text style={styles.imageButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} onPress={handlePickImage} activeOpacity={0.8}>
                  <Text style={styles.imageButtonIcon}>🖼️</Text>
                  <Text style={styles.imageButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <Button
            title="Identify Disposal Method"
            onPress={handleSubmit}
            disabled={!canSubmit}
            size="large"
            icon="🔍"
          />
        </View>

        {/* Recent Items */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Items</Text>

          <RecentItem
            icon="♻️"
            name="Plastic Water Bottle"
            category="Recycle"
            onPress={() => setItemText("Plastic Water Bottle")}
          />
          <RecentItem
            icon="🗑️"
            name="Pizza Box (greasy)"
            category="Trash"
            onPress={() => setItemText("Pizza Box")}
          />
          <RecentItem
            icon="⚠️"
            name="AA Batteries"
            category="Hazardous"
            onPress={() => setItemText("AA Batteries")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textSecondary },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  profileIcon: { fontSize: 24 },
  statsContainer: { flexDirection: "row", gap: SPACING.md },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  statIcon: { fontSize: 28, marginBottom: SPACING.xs },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, textAlign: "center" },
  inputSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.lg,
    ...SHADOWS.md,
  },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text },
  textInputContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  textInput: {
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: "top",
  },
  divider: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium },
  imageSection: { minHeight: 120 },
  imageButtons: { flexDirection: "row", gap: SPACING.md },
  imageButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: "center",
    gap: SPACING.sm,
  },
  imageButtonIcon: { fontSize: 32 },
  imageButtonText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, textAlign: "center", fontWeight: TYPOGRAPHY.fontWeight.medium },
  imagePreview: { position: "relative", borderRadius: BORDER_RADIUS.md, overflow: "hidden" },
  previewImage: { width: "100%", height: 200, borderRadius: BORDER_RADIUS.md },
  removeImageButton: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: { color: COLORS.surface, fontSize: 18, fontWeight: TYPOGRAPHY.fontWeight.bold },
  recentSection: { gap: SPACING.md },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  recentIcon: { fontSize: 24 },
  recentInfo: { flex: 1 },
  recentName: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.medium, color: COLORS.text, marginBottom: 2 },
  recentCategory: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  recentArrow: { fontSize: 20, color: COLORS.textLight },
});