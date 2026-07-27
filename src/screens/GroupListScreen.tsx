import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Share from 'react-native-share';
import {
  addGroup,
  createGroupEvent,
  createGroupInvite,
  exemptPlayerPayment,
  GameGroup,
  getCurrentUserId,
  subscribeToGroups,
  updateGroupInfo,
} from '../services/groupService';

type GroupListScreenProps = {
  onLogout?: () => void;
  onBack?: () => void;
};

const GroupListScreen = ({ onLogout, onBack }: GroupListScreenProps) => {
  const [groups, setGroups] = useState<GameGroup[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminAction, setAdminAction] = useState<'edit' | 'createEvent' | 'exemptPayment' | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GameGroup | null>(null);
  const [adminInputName, setAdminInputName] = useState('');
  const [adminInputDescription, setAdminInputDescription] = useState('');
  const [adminInputDate, setAdminInputDate] = useState('');
  const [adminInputPlayerId, setAdminInputPlayerId] = useState('');
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = subscribeToGroups(
      fetchedGroups => setGroups(fetchedGroups),
      error => {
        Alert.alert('Erro ao carregar grupos', error.message);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Por favor, informe um nome para o grupo.');
      return;
    }

    setLoading(true);
    try {
      await addGroup({
        name: name.trim(),
        description: description.trim(),
        isPublic,
        ownerId: getCurrentUserId(),
      });
      setName('');
      setDescription('');
      setIsPublic(true);
      Alert.alert('Grupo criado', 'O grupo foi salvo no Firestore com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro ao criar grupo', error.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = async (group: GameGroup) => {
    if (!isGroupAdmin(group)) {
      Alert.alert('Permissão negada', 'Apenas administradores podem gerar convites para este grupo.');
      return;
    }

    try {
      const inviteUrl = await createGroupInvite(group.id);
      setInviteLinks(prev => ({ ...prev, [group.id]: inviteUrl }));
      Alert.alert('Convite gerado', 'O link de convite foi criado com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro ao gerar convite', error.message ?? 'Tente novamente.');
    }
  };

  const createInviteLink = async (group: GameGroup) => {
    if (group.isPublic) {
      return `https://jogamuito.app/grupo/${group.id}`;
    }

    if (!isGroupAdmin(group)) {
      throw new Error('Apenas administradores podem gerar convites para grupos privados.');
    }

    return await createGroupInvite(group.id);
  };

  const handleShareInvite = async (group: GameGroup) => {
    try {
      const inviteUrl = await createInviteLink(group);
      const shareOptions = {
        title: 'Convite para o grupo',
        message: `Junte-se ao grupo ${group.name} no JogaMuito! ${inviteUrl}`,
        url: inviteUrl,
        social: Share.Social.WHATSAPP,
      };

      await Share.open(shareOptions);
    } catch (error: any) {
      if (error?.message?.includes('not installed')) {
        Alert.alert('WhatsApp não encontrado', 'Instale o WhatsApp para compartilhar o convite.');
      } else if (error?.message !== 'User did not share') {
        Alert.alert('Erro ao compartilhar', error.message ?? 'Tente novamente.');
      }
    }
  };

  const currentUserId = getCurrentUserId();
  const isGroupAdmin = (group: GameGroup) => !!currentUserId && (group.admins ?? []).includes(currentUserId);

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
        Alert.alert('Grupo atualizado', 'As informações do grupo foram alteradas.');
      }

      if (adminAction === 'createEvent') {
        if (!adminInputName.trim()) {
          Alert.alert('Título obrigatório', 'Informe um título para o evento.');
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
          Alert.alert('Jogador obrigatório', 'Informe o ID do jogador a ser isento.');
          return;
        }

        await exemptPlayerPayment(selectedGroup.id, adminInputPlayerId.trim());
        Alert.alert('Isenção concedida', 'O jogador foi marcado como isento de pagamento.');
      }

      closeAdminModal();
    } catch (error: any) {
      Alert.alert('Erro administrativo', error.message ?? 'A ação não pôde ser concluída.');
    }
  };

  const renderGroupItem = ({ item }: { item: GameGroup }) => (
    <View style={styles.groupCard} testID={`groupCard-${item.id}`}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{item.name}</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.groupBadge}>{item.isPublic ? 'Público' : 'Privado'}</Text>
          {isGroupAdmin(item) ? <Text style={styles.adminBadge}>Admin</Text> : null}
        </View>
      </View>
      <Text style={styles.groupDescription}>{item.description}</Text>
      <Text style={styles.groupMeta}>Criado por: {item.ownerId ?? 'Anônimo'}</Text>
      <Pressable
        testID={`generateInviteButton-${item.id}`}
        style={[styles.button, styles.generateButton]}
        onPress={() => handleGenerateInvite(item)}
      >
        <Text style={styles.buttonText}>Gerar convite</Text>
      </Pressable>
      {inviteLinks[item.id] ? (
        <View style={styles.inviteLinkContainer}>
          <Text testID="generatedInviteLink" style={styles.inviteLinkText}>
            {inviteLinks[item.id]}
          </Text>
        </View>
      ) : null}
      <Pressable
        testID={`shareGroupButton-${item.id}`}
        style={[styles.button, styles.shareButton]}
        onPress={() => handleShareInvite(item)}
      >
        <Text style={styles.shareButtonText}>
          {item.isPublic ? 'Compartilhar link' : 'Compartilhar convite'}
        </Text>
      </Pressable>
      {isGroupAdmin(item) ? (
        <View style={styles.adminActionsRow}>
          <Pressable testID={`editGroupButton-${item.id}`} style={styles.adminActionButton} onPress={() => openAdminAction(item, 'edit')}>
            <Text style={styles.adminActionText}>Editar grupo</Text>
          </Pressable>
          <Pressable testID={`createEventButton-${item.id}`} style={styles.adminActionButton} onPress={() => openAdminAction(item, 'createEvent')}>
            <Text style={styles.adminActionText}>Criar evento</Text>
          </Pressable>
          <Pressable testID={`exemptPaymentButton-${item.id}`} style={styles.adminActionButton} onPress={() => openAdminAction(item, 'exemptPayment')}>
            <Text style={styles.adminActionText}>Isentar pagamento</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            {onBack ? (
              <Pressable style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>Voltar</Text>
              </Pressable>
            ) : null}
            <Text style={styles.screenTitle}>Grupos de Jogo</Text>
          </View>
          {onLogout ? (
            <Pressable testID="logoutButton" style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutButtonText}>Sair</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Criar novo grupo</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            testID="groupNameInput"
            value={name}
            onChangeText={setName}
            placeholder="Ex: Amigos do Fute"
            style={styles.input}
            editable={!loading}
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            testID="groupDescriptionInput"
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição do grupo"
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
            editable={!loading}
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Grupo público</Text>
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

        <Text style={styles.sectionTitle}>Grupos existentes</Text>

        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          renderItem={renderGroupItem}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum grupo encontrado ainda.</Text>}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={false}
        />

        <Modal visible={adminModalVisible} animationType="slide" transparent>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {adminAction === 'edit' && 'Editar informações do grupo'}
                {adminAction === 'createEvent' && 'Criar novo evento'}
                {adminAction === 'exemptPayment' && 'Isentar jogador do pagamento'}
              </Text>

              {(adminAction === 'edit' || adminAction === 'createEvent') && (
                <>
                  <Text style={styles.label}>Título</Text>
                  <TextInput
                    value={adminInputName}
                    onChangeText={setAdminInputName}
                    placeholder={adminAction === 'edit' ? 'Nome do grupo' : 'Título do evento'}
                    style={styles.input}
                  />
                  <Text style={styles.label}>Descrição</Text>
                  <TextInput
                    value={adminInputDescription}
                    onChangeText={setAdminInputDescription}
                    placeholder={adminAction === 'edit' ? 'Descrição do grupo' : 'Descrição do evento'}
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
    backgroundColor: '#eef2ff',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 18,
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 18,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
    marginBottom: 14,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ef4444',
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 40,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    color: '#111827',
    flex: 1,
  },
  groupBadge: {
    marginLeft: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadge: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  adminActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  adminActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 8,
    minWidth: '30%',
  },
  adminActionText: {
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 12,
  },
  groupDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 10,
  },
  groupMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  shareButton: {
    marginTop: 12,
    backgroundColor: '#25d366',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 360,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 18,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 18,
  },
});

export default GroupListScreen;
