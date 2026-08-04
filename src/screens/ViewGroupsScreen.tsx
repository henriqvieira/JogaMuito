import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Share from 'react-native-share';
import { theme } from '../design/theme';
import {
  createGroupEvent,
  createGroupInvite,
  exemptPlayerPayment,
  GameGroup,
  getCurrentUserId,
  getGroupDisplayId,
  getGroupOwnerDisplayName,
  isUserAdmin,
  loadVisibleGroups,
  updateGroupInfo,
} from '../services/groupService';

type ViewGroupsScreenProps = {
  onBack?: () => void;
};

const ViewGroupsScreen = ({ onBack }: ViewGroupsScreenProps) => {
  const [memberGroups, setMemberGroups] = useState<GameGroup[]>([]);
  const [publicGroups, setPublicGroups] = useState<GameGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminAction, setAdminAction] = useState<'edit' | 'createEvent' | 'exemptPayment' | null>(
    null,
  );
  const [selectedGroup, setSelectedGroup] = useState<GameGroup | null>(null);
  const [adminInputName, setAdminInputName] = useState('');
  const [adminInputDescription, setAdminInputDescription] = useState('');
  const [adminInputDate, setAdminInputDate] = useState('');
  const [adminInputPlayerId, setAdminInputPlayerId] = useState('');
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});

  const refreshGroups = async () => {
    setLoading(true);
    try {
      const visibleGroups = await loadVisibleGroups();
      setMemberGroups(visibleGroups.memberGroups);
      setPublicGroups(visibleGroups.publicGroups);
    } catch (error: any) {
      Alert.alert('Erro ao carregar grupos', error.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshGroups();
  }, []);

  const createInviteLink = async (group: GameGroup) => {
    if (group.isPublic) {
      return `https://jogamuito.app/grupo/${group.id}`;
    }

    if (!isUserAdmin(group)) {
      throw new Error('Apenas administradores podem gerar convites para grupos privados.');
    }

    return createGroupInvite(group.id);
  };

  const handleGenerateInvite = async (group: GameGroup) => {
    if (!isUserAdmin(group)) {
      Alert.alert('Permissao negada', 'Apenas administradores podem gerar convites.');
      return;
    }

    try {
      const inviteUrl = await createGroupInvite(group.id);
      setInviteLinks((prev) => ({ ...prev, [group.id]: inviteUrl }));
      Alert.alert('Convite gerado', 'O link de convite foi criado com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro ao gerar convite', error.message ?? 'Tente novamente.');
    }
  };

  const handleShareInvite = async (group: GameGroup) => {
    if (!isUserAdmin(group)) {
      return;
    }

    try {
      const inviteUrl = await createInviteLink(group);
      await Share.open({
        title: 'Convite para o grupo',
        message: `Junte-se ao grupo ${group.name} no JogaMuito! ${inviteUrl}`,
        url: inviteUrl,
        social: Share.Social.WHATSAPP,
      });
    } catch (error: any) {
      if (error?.message?.includes('not installed')) {
        Alert.alert('WhatsApp nao encontrado', 'Instale o WhatsApp para compartilhar o convite.');
      } else if (error?.message !== 'User did not share') {
        Alert.alert('Erro ao compartilhar', error.message ?? 'Tente novamente.');
      }
    }
  };

  const openAdminAction = (group: GameGroup, action: 'edit' | 'createEvent' | 'exemptPayment') => {
    setSelectedGroup(group);
    setAdminAction(action);
    setAdminModalVisible(true);
    setAdminInputName(group.name);
    setAdminInputDescription(group.description);
    setAdminInputDate('');
    setAdminInputPlayerId('');
  };

  const closeAdminModal = () => {
    setAdminModalVisible(false);
    setSelectedGroup(null);
    setAdminAction(null);
  };

  const handleAdminSubmit = async () => {
    if (!selectedGroup || !adminAction) {
      return;
    }

    try {
      if (adminAction === 'edit') {
        await updateGroupInfo(selectedGroup.id, {
          name: adminInputName.trim() || undefined,
          description: adminInputDescription.trim() || undefined,
        });
        Alert.alert('Grupo atualizado', 'As informacoes do grupo foram alteradas.');
      }

      if (adminAction === 'createEvent') {
        if (!adminInputName.trim()) {
          Alert.alert('Titulo obrigatorio', 'Informe um titulo para o evento.');
          return;
        }

        await createGroupEvent(selectedGroup.id, {
          title: adminInputName.trim(),
          description: adminInputDescription.trim(),
          date: adminInputDate.trim() || undefined,
        });
        Alert.alert('Evento criado', 'O evento foi adicionado ao grupo.');
      }

      if (adminAction === 'exemptPayment') {
        if (!adminInputPlayerId.trim()) {
          Alert.alert('Jogador obrigatorio', 'Informe o ID do jogador a ser isento.');
          return;
        }

        await exemptPlayerPayment(selectedGroup.id, adminInputPlayerId.trim());
        Alert.alert('Isencao concedida', 'O jogador foi marcado como isento de pagamento.');
      }

      closeAdminModal();
      await refreshGroups();
    } catch (error: any) {
      Alert.alert('Erro administrativo', error.message ?? 'A acao nao pode ser concluida.');
    }
  };

  const renderGroupCard = (group: GameGroup) => {
    const currentUserId = getCurrentUserId();
    const isAdmin = isUserAdmin(group);
    const isParticipant = !!currentUserId && (group.members ?? []).includes(currentUserId);

    return (
      <View key={group.id} style={styles.groupCard} testID={`groupCard-${group.id}`}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{group.name}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.groupBadge}>{group.isPublic ? 'Publico' : 'Privado'}</Text>
            <Text style={styles.groupBadge}>
              {isAdmin ? 'Admin' : isParticipant ? 'Participante' : 'Visita'}
            </Text>
          </View>
        </View>

        <Text style={styles.groupDescription}>
          {group.description || 'Sem descricao informada.'}
        </Text>
        <Text style={styles.groupMeta}>Criado por: {getGroupOwnerDisplayName(group)}</Text>
        <Text testID="groupIdText" style={styles.groupMetaStrong}>
          Codigo: {getGroupDisplayId(group)}
        </Text>

        {isAdmin ? (
          <Text testID="groupInternalIdText" style={styles.groupMetaMuted}>
            Referencia interna: {group.id}
          </Text>
        ) : null}

        {isAdmin ? (
          <>
            <Pressable
              testID={`generateInviteButton-${group.id}`}
              style={[styles.button, styles.generateButton]}
              onPress={() => handleGenerateInvite(group)}
            >
              <Text style={styles.buttonText}>Gerar convite</Text>
            </Pressable>

            {inviteLinks[group.id] ? (
              <View style={styles.inviteLinkContainer}>
                <Text testID="generatedInviteLink" style={styles.inviteLinkText}>
                  {inviteLinks[group.id]}
                </Text>
              </View>
            ) : null}

            <Pressable
              testID={`shareGroupButton-${group.id}`}
              style={[styles.button, styles.shareButton]}
              onPress={() => handleShareInvite(group)}
            >
              <Text style={styles.buttonText}>
                {group.isPublic ? 'Compartilhar link' : 'Compartilhar convite'}
              </Text>
            </Pressable>

            <View style={styles.adminActionsRow}>
              <Pressable
                testID={`editGroupButton-${group.id}`}
                style={styles.adminActionButton}
                onPress={() => openAdminAction(group, 'edit')}
              >
                <Text style={styles.adminActionText}>Editar grupo</Text>
              </Pressable>
              <Pressable
                testID={`createEventButton-${group.id}`}
                style={styles.adminActionButton}
                onPress={() => openAdminAction(group, 'createEvent')}
              >
                <Text style={styles.adminActionText}>Criar evento</Text>
              </Pressable>
              <Pressable
                testID={`exemptPaymentButton-${group.id}`}
                style={styles.adminActionButton}
                onPress={() => openAdminAction(group, 'exemptPayment')}
              >
                <Text style={styles.adminActionText}>Isentar pagamento</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text style={styles.permissionHint}>
            Somente administradores podem editar ou convidar.
          </Text>
        )}
      </View>
    );
  };

  const renderSection = (title: string, groups: GameGroup[], emptyText: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {groups.length ? (
        groups.map(renderGroupCard)
      ) : (
        <Text style={styles.emptyText}>{emptyText}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.titleRow}>
          {onBack ? (
            <Pressable style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Voltar</Text>
            </Pressable>
          ) : null}
          <Text style={styles.screenTitle}>Ver Grupos</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Catalogo de grupos</Text>
          <Text style={styles.heroSubtitle}>
            Veja seus grupos e tambem os grupos publicos disponiveis. Participantes apenas
            visualizam; administradores editam.
          </Text>
        </View>

        {loading ? <Text style={styles.emptyText}>Carregando grupos...</Text> : null}
        {!loading
          ? renderSection('Seus grupos', memberGroups, 'Voce ainda nao participa de nenhum grupo.')
          : null}
        {!loading
          ? renderSection(
              'Grupos publicos',
              publicGroups,
              'Nenhum grupo publico disponivel no momento.',
            )
          : null}

        <Modal visible={adminModalVisible} animationType="slide" transparent>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {adminAction === 'edit' && 'Editar informacoes do grupo'}
                {adminAction === 'createEvent' && 'Criar novo evento'}
                {adminAction === 'exemptPayment' && 'Isentar jogador do pagamento'}
              </Text>

              {(adminAction === 'edit' || adminAction === 'createEvent') && (
                <>
                  <Text style={styles.label}>Titulo</Text>
                  <TextInput
                    value={adminInputName}
                    onChangeText={setAdminInputName}
                    placeholder={adminAction === 'edit' ? 'Nome do grupo' : 'Titulo do evento'}
                    style={styles.input}
                  />

                  <Text style={styles.label}>Descricao</Text>
                  <TextInput
                    value={adminInputDescription}
                    onChangeText={setAdminInputDescription}
                    placeholder={
                      adminAction === 'edit' ? 'Descricao do grupo' : 'Descricao do evento'
                    }
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={3}
                  />
                </>
              )}

              {adminAction === 'createEvent' ? (
                <>
                  <Text style={styles.label}>Data do evento</Text>
                  <TextInput
                    value={adminInputDate}
                    onChangeText={setAdminInputDate}
                    placeholder="YYYY-MM-DD"
                    style={styles.input}
                  />
                </>
              ) : null}

              {adminAction === 'exemptPayment' ? (
                <>
                  <Text style={styles.label}>ID do jogador</Text>
                  <TextInput
                    value={adminInputPlayerId}
                    onChangeText={setAdminInputPlayerId}
                    placeholder="ID do jogador"
                    style={styles.input}
                  />
                </>
              ) : null}

              <View style={styles.modalButtonsRow}>
                <Pressable style={[styles.button, styles.modalButton]} onPress={closeAdminModal}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.modalButton]} onPress={handleAdminSubmit}>
                  <Text style={styles.buttonText}>Confirmar</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  groupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  groupBadge: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  groupDescription: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 10,
  },
  groupMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  groupMetaStrong: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  groupMetaMuted: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  generateButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primaryDark,
  },
  inviteLinkContainer: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },
  inviteLinkText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  shareButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: '#25d366',
  },
  adminActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  adminActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    minWidth: '30%',
  },
  adminActionText: {
    color: theme.colors.text,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 12,
  },
  permissionHint: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    minHeight: 360,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
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
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default ViewGroupsScreen;
