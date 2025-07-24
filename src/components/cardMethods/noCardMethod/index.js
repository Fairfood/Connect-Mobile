/* eslint-disable function-paren-newline */
/* eslint-disable no-return-assign */
/* eslint-disable camelcase */
/* eslint-disable global-require */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal } from 'react-native';
import { AVATAR_BG_COLORS } from '../../../utils/constants';
import FarmerListItem from '../../lists/farmerListItem';
import SearchComponent from '../../searchComponent';
import CustomButton from '../../buttons/customButton';
import I18n from '../../../translations/text/i18n';
import StyleSheetFactory from './styles';

const NoCardMethod = ({ ...props }) => {
  const {
    incomingFarmer,
    allFarmersList,
    onSubmit,
    cardSection = null,
  } = props;
  const styles = StyleSheetFactory();

  const [selectedFarmer, setSelectedFarmer] = useState(incomingFarmer);
  const [selectedColor, setSelectedColor] = useState(AVATAR_BG_COLORS[0]);
  const [farmersList, setFarmersList] = useState(allFarmersList);
  const [displayModal, setDisplayModal] = useState(false);
  const [error, setError] = useState(null);

  const renderItem = ({ item, index }) => (
    <FarmerListItem
      index={index}
      item={item}
      onPress={(i, avatarBgColor) => {
        setDisplayModal(false);
        setSelectedFarmer(i);
        setSelectedColor(avatarBgColor);
        setError(null);
        setFarmersList(allFarmersList);
      }}
      avatarBgColor={AVATAR_BG_COLORS[index % AVATAR_BG_COLORS.length]}
    />
  );

  /**
   * filtering farmer list based on search text
   * @param {string} text search text
   */
  const onSearch = (text) => {
    const searchText = text.toLowerCase();
    if (searchText === '') {
      setFarmersList(allFarmersList);
    } else {
      const filteredFarmers = allFarmersList.filter((farmer) => {
        let { name } = farmer;
        name = name.toLowerCase();
        return name.includes(searchText);
      });
      filteredFarmers.reverse();
      setFarmersList(filteredFarmers);
    }
  };

  /**
   * submit function
   */
  const handleSubmit = () => {
    if (!selectedFarmer) {
      setError(I18n.t('select_a_farmer'));
    } else {
      onSubmit(selectedFarmer);
    }
  };

  const closeDisplayModal = () => {
    setSelectedColor(null);
    setSelectedFarmer(null);
    setFarmersList(allFarmersList);
    setDisplayModal(false);
  };

  return (
    <View style={styles.container}>
      <View>
        {cardSection}

        <View style={styles.formTitleContainer}>
          <Text style={styles.formTitle} testID="select-farmer-field-header">
            {`${I18n.t('select_farmer')}*`}
          </Text>
        </View>

        {selectedFarmer == null && (
          <TouchableOpacity
            onPress={() => setDisplayModal(true)}
            style={styles.selectFarmerWrap}
            testID="select-farmer-field"
          >
            <Text style={styles.selectFarmerText}>
              {I18n.t('select_a_farmer')}
            </Text>
          </TouchableOpacity>
        )}

        {error && (
          <Text style={styles.errorMessage} testID="no-card-error">
            {error}
          </Text>
        )}

        {selectedFarmer != null && (
          <View style={styles.selectedWrap} testID="farmer-selected-wrap">
            <FarmerListItem
              index={0}
              item={selectedFarmer}
              onClose={closeDisplayModal}
              avatarBgColor={selectedColor}
              displayClose
            />
          </View>
        )}

        <CustomButton
          buttonText={I18n.t('verify_with_photo')}
          onPress={() => handleSubmit(selectedFarmer)}
          extraStyle={{ width: '100%' }}
          testID="no-card-submit"
        />
      </View>

      {displayModal && selectedFarmer == null && (
        <Modal
          animationType="slide"
          transparent
          visible={displayModal}
          onRequestClose={closeDisplayModal}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 58, 96, 0.2)' }}>
            <TouchableOpacity
              onPress={closeDisplayModal}
              style={{ height: '40%' }}
            />
            <View style={styles.searchFarmerWrap} testID="farmer-list-modal">
              <SearchComponent
                placeholder={I18n.t('search_farmers')}
                onChangeText={(text) => onSearch(text)}
              />
              <FlatList
                data={farmersList}
                renderItem={renderItem}
                keyboardShouldPersistTaps="always"
                style={styles.flatListStyle}
                ListEmptyComponent={
                  <View style={styles.emptyList} testID="empty-farmer-list">
                    <Text
                      style={styles.emptyText}
                      testID="empty-farmer-list-text"
                    >
                      {I18n.t('no_farmers')}
                    </Text>
                  </View>
                }
                keyExtractor={(item, index) => index.toString()}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default NoCardMethod;
