import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { modules } from '../../constants/modules';

export default function ModulesScreen() {
  const router = useRouter();

  const renderModuleCard = ({ item, index }: { item: any, index: number }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/module/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
            <Image source={item.imageUrl} style={styles.cardImage} contentFit="cover" />
            <LinearGradient
                colors={['#0C0F97', '#4f46e5']}
                style={styles.moduleNumberContainer}
            >
                <Text style={styles.moduleNumber}>{index + 1}</Text>
            </LinearGradient>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardAction}>Mulai Belajar</Text>
            <Ionicons name="arrow-forward" size={16} color="#4f46e5" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={modules}
        renderItem={renderModuleCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Daftar Modul</Text>
                <Text style={styles.headerSubtitle}>Pilih topik yang ingin Anda pelajari.</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e1b4b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  moduleNumberContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  moduleNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1b4b',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
    marginRight: 4,
  },
});