import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../design/theme';
import {
  addGroup,
  GameGroup,
  getCurrentUserId,
  getCurrentUserName,
  getGroupDisplayId,
} from '../services/groupService';

type CreateGroupScreenProps = {
  onBack?: () => void;
  onViewGroups?: () => void;
};

const CreateGroupScreen = ({ onBack, onViewGroups }: CreateGroupScreenProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<GameGroup | null>(null);

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatorio', 'Por favor, informe um nome para o grupo.');
      return;
    }

    setLoading(true);
    try {
      const ownerId = getCurrentUserId();
      const createdGroupRef = await addGroup({
        name: name.trim(),
        description: description.trim(),
        isPublic,
        ownerId,
      });

      const newGroup: GameGroup = {
        id: createdGroupRef.id,
        groupId: createdGroupRef.groupId ?? createdGroupRef.id,
        groupNumber: createdGroupRef.groupNumber,
        name: name.trim(),
        description: description.trim(),
        isPublic,
        ownerId,
        ownerName: getCurrentUserName(),
        displayId: createdGroupRef.displayId ?? getGroupDisplayId({ id: createdGroupRef.id, groupNumber: createdGroupRef.groupNumber }),
        members: ownerId ? [ownerId] : [],
        admins: ownerId ? [ownerId] : [],
        paymentExemptions: [],
      };

      setCreatedGroup(newGroup);
      setName('');
      setDescription('');
      setIsPublic(true);
      Alert.alert('Grupo criado', 'O grupo foi salvo com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro ao criar grupo', error.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.titleRow}>
          {onBack ? (
            <Pressable style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Voltar</Text>
            </Pressable>
          ) : null}
          <Text style={styles.screenTitle}>Criar Grupo</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Monte um novo grupo</Text>
          <Text style={styles.heroSubtitle}>
            Defina nome, descricao e visibilidade. A administracao fica com o criador.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Formulario de criacao</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            testID="groupNameInput"
            value={name}
            onChangeText={setName}
            placeholder="Ex: Amigos do Fute"
            style={styles.input}
            editable={!loading}
          />

          <Text style={styles.label}>Descricao</Text>
          <TextInput
            testID="groupDescriptionInput"
            value={description}
            onChangeText={setDescription}
            placeholder="Descricao do grupo"
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
            editable={!loading}
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Grupo publico</Text>
            <Switch
              testID="groupPublicSwitch"
              value={isPublic}
              onValueChange={setIsPublic}
              disabled={loading}
            />
          </View>

          <Pressable
            testID="createGroupButton"
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreateGroup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Salvando...' : 'Criar grupo'}</Text>
          </Pressable>
        </View>

        {createdGroup ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Grupo criado com sucesso</Text>
            <Text style={styles.metaText}>Nome: {createdGroup.name}</Text>
            <Text style={styles.metaText}>Criado por: {createdGroup.ownerName}</Text>
            <Text testID="createdGroupFriendlyIdText" style={styles.metaTextStrong}>
              Codigo do grupo: {getGroupDisplayId(createdGroup)}
            </Text>

            {onViewGroups ? (
              <Pressable
                testID="goToViewGroupsButton"
                style={[styles.button, styles.secondaryButton]}
                onPress={onViewGroups}
              >
                <Text style={styles.buttonText}>Ver grupos</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  backButton: {
    marginRight: theme.spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
  },
  backButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  heroSubtitle: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceAlt,
    marginBottom: theme.spacing.sm,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.info,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  metaTextStrong: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '700',
  },
});

export default CreateGroupScreen;
