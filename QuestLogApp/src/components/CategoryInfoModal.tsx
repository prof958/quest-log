import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';

export interface RatingCategory {
  id: string;
  shortName: string;
  fullName: string;
  description: string;
  icon: string;
}

export const RATING_CATEGORIES: RatingCategory[] = [
  {
    id: 'story',
    shortName: 'Story',
    fullName: 'Story & Worldbuilding',
    description: 'Narrative depth, characters, pacing, emotional impact. How well does the game tell its story and build its world?',
    icon: '📖',
  },
  {
    id: 'gameplay',
    shortName: 'Gameplay',
    fullName: 'Gameplay & Mechanics',
    description: 'Controls, challenge, systems, polish, replayability. How good does the game feel to play mechanically?',
    icon: '🎮',
  },
  {
    id: 'audio',
    shortName: 'Audio',
    fullName: 'Audio & Atmosphere',
    description: 'Music, sound design, immersion, emotional tone. How well does audio enhance the experience?',
    icon: '🎵',
  },
  {
    id: 'visual',
    shortName: 'Visual',
    fullName: 'Visual & Artistic Value',
    description: 'Style, art direction, UI, performance aesthetics. How pleasing and cohesive is the visual presentation?',
    icon: '🎨',
  },
  {
    id: 'joy',
    shortName: 'Joy Factor',
    fullName: 'Joy Factor',
    description: 'How much fun or addiction you felt moment to moment. That undefinable "spark" - how the game feels to play.',
    icon: '✨',
  },
];

interface CategoryInfoModalProps {
  visible: boolean;
  category: RatingCategory | null;
  onClose: () => void;
}

export const CategoryInfoModal: React.FC<CategoryInfoModalProps> = ({
  visible,
  category,
  onClose,
}) => {
  if (!category) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.icon}>{category.icon}</Text>
                <Text style={styles.title}>{category.fullName}</Text>
              </View>

              {/* Description */}
              <ScrollView style={styles.descriptionContainer}>
                <Text style={styles.description}>{category.description}</Text>
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: RetroTheme.colors.layer2,
    borderRadius: RetroTheme.borderRadius.lg,
    borderWidth: 3,
    borderColor: RetroTheme.colors.primary,
    padding: 20,
    ...RetroTheme.shadows.large,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: RetroTheme.colors.text,
    textAlign: 'center',
  },
  descriptionContainer: {
    maxHeight: 200,
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    color: RetroTheme.colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: RetroTheme.colors.primary,
    borderRadius: RetroTheme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    ...RetroTheme.shadows.small,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
