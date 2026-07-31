import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../design/theme';

type AppShellProps = {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
};

const AppShell = ({ title, subtitle, leftAction, rightAction, children }: AppShellProps) => (
  <View style={styles.container}>
    <View style={styles.headerCard}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerTitleGroup}>
          {leftAction}
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {rightAction}
      </View>
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    ...theme.shadows.card,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
});

export default AppShell;
