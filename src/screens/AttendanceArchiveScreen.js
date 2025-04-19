import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Title, Text, Button, IconButton, List, Divider, Chip, Searchbar, Menu } from 'react-native-paper';
import CustomCard from '../components/CustomCard';
import { getAllAttendance, deleteAttendance, archiveAttendance, getArchivedAttendance, restoreAttendance } from '../database/database';

const AttendanceArchiveScreen = ({ navigation }) => {
  const [archivedRecords, setArchivedRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    loadArchivedRecords();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRecords(archivedRecords);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = archivedRecords.filter(record => 
        record.subject.toLowerCase().includes(query) || 
        record.date.includes(query) ||
        record.status.toLowerCase().includes(query)
      );
      setFilteredRecords(filtered);
    }
  }, [searchQuery, archivedRecords]);

  const loadArchivedRecords = async () => {
    try {
      const records = await getArchivedAttendance();
      setArchivedRecords(records);
      setFilteredRecords(records);
    } catch (error) {
      console.error('Error loading archived records:', error);
      Alert.alert('Error', 'Failed to load archived attendance records');
    }
  };

  const handleRestore = async (record) => {
    try {
      await restoreAttendance(record.id);
      Alert.alert('Success', 'Record restored successfully');
      await loadArchivedRecords();
    } catch (error) {
      console.error('Error restoring record:', error);
      Alert.alert('Error', 'Failed to restore record');
    }
  };

  const handleDelete = async (record) => {
    try {
      const confirmed = await new Promise(resolve => {
        Alert.alert(
          'Confirm Delete',
          'Are you sure you want to permanently delete this record?',
          [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Delete', onPress: () => resolve(true), style: 'destructive' },
          ],
          { cancelable: false }
        );
      });

      if (confirmed) {
        await deleteAttendance(record.id);
        Alert.alert('Success', 'Record deleted successfully');
        await loadArchivedRecords();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      Alert.alert('Error', 'Failed to delete record');
    }
  };

  const showMenu = (record) => {
    setSelectedRecord(record);
    setMenuVisible(true);
  };

  const hideMenu = () => {
    setMenuVisible(false);
    setSelectedRecord(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderStatusChip = (status) => {
    let color = '#4CAF50'; // green for present
    if (status === 'absent') {
      color = '#F44336'; // red for absent
    } else if (status === 'late') {
      color = '#FFC107'; // yellow for late
    }

    return (
      <Chip 
        style={[styles.statusChip, { backgroundColor: color }]}
        textStyle={{ color: 'white' }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Chip>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Title style={styles.title}>Attendance Archive</Title>
      </View>

      <Searchbar
        placeholder="Search by subject, date, or status"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView style={styles.scrollView}>
        {filteredRecords.length > 0 ? (
          filteredRecords.map(record => (
            <CustomCard key={record.id} style={styles.card}>
              <CustomCard.Content>
                <View style={styles.cardHeader}>
                  <Title>{record.subject}</Title>
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => showMenu(record)}
                  />
                  {selectedRecord && selectedRecord.id === record.id && (
                    <Menu
                      visible={menuVisible}
                      onDismiss={hideMenu}
                      anchor={{ x: 0, y: 0 }}
                      style={styles.menu}
                    >
                      <Menu.Item 
                        onPress={() => {
                          hideMenu();
                          handleRestore(record);
                        }} 
                        title="Restore" 
                        leadingIcon="restore"
                      />
                      <Menu.Item 
                        onPress={() => {
                          hideMenu();
                          handleDelete(record);
                        }} 
                        title="Delete" 
                        leadingIcon="delete"
                      />
                    </Menu>
                  )}
                </View>
                <Divider style={styles.divider} />
                <View style={styles.cardContent}>
                  <Text>Date: {formatDate(record.date)}</Text>
                  <Text>Status: {renderStatusChip(record.status)}</Text>
                  {record.multiplier > 1 && (
                    <Text>Multiplier: {record.multiplier}</Text>
                  )}
                  {record.notes && (
                    <Text>Notes: {record.notes}</Text>
                  )}
                </View>
              </CustomCard.Content>
            </CustomCard>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No archived records found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    marginLeft: 8,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContent: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
  statusChip: {
    marginVertical: 4,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    fontStyle: 'italic',
  },
  menu: {
    marginTop: 40,
  },
});

export default AttendanceArchiveScreen;
