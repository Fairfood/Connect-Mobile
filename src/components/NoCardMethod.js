/* eslint-disable function-paren-newline */
/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable no-return-assign */
/* eslint-disable camelcase */
/* eslint-disable global-require */
import React, { useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { AVATAR_BG_COLORS, AVATAR_AS_LETTERS } from '../services/constants';
import FarmerListItem from './FarmerListItem';
import CustomTextInput from './CustomTextInput';
import SearchComponent from './SearchComponent';
import CustomButton from './CustomButton';
import I18n from '../i18n/i18n';

const { height, width } = Dimensions.get('window');

const NoCardMethod = ({ ...props }) => {
  const {
    incomingFarmer,
    allFarmersList,
    onSubmit,
    cardSection = null,
  } = props;

  const { theme } = useSelector((state) => state.common);
  const [selectedFarmer, setSelectedFarmer] = useState(incomingFarmer);
  const [selectedColor, setSelectedColor] = useState(AVATAR_BG_COLORS[0]);
  const [farmersList, setFarmersList] = useState(allFarmersList);
  const [displayModal, setDisplayModal] = useState(false);
  const [error, setError] = useState(null);

  const renderItem = ({ item, index }) => (
    <FarmerListItem
      item={item}
      onPress={(i, avatarBgColor) => {
        setDisplayModal(false);
        setSelectedFarmer(i);
        setError(null);
        setSelectedColor(avatarBgColor);
        setFarmersList(allFarmersList);
      }}
      avatarBgColor={
        AVATAR_AS_LETTERS
          ? AVATAR_BG_COLORS[index % AVATAR_BG_COLORS.length]
          : null
      }
    />
  );

  /**
   * filtering farmer list based on search text
   * @param {string} text serch text
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

  const styles = StyleSheetFactory(theme);

  const emptyComponent = () => {
    return (
      <View style={styles.emptyList}>
        <Text style={styles.formTitle}>{I18n.t('no_farmers')}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View>
        {cardSection}

        <View
          style={[
            styles.formTitleContainer,
            { marginBottom: selectedFarmer ? 0 : 20 },
          ]}
        >
          <Text style={[styles.formTitle, { textAlign: 'left' }]}>
            {`${I18n.t('select_farmer')}*`}
          </Text>
        </View>

        {selectedFarmer == null && (
          <TouchableOpacity onPress={() => setDisplayModal(true)}>
            <CustomTextInput
              placeholder={I18n.t('select_a_farmer')}
              editable={false}
              extraStyle={{ width: '100%', alignSelf: 'center' }}
            />
          </TouchableOpacity>
        )}

        {error !== '' && <Text style={styles.errorMessage}>{error}</Text>}

        {selectedFarmer != null && (
          <View style={styles.selectedWrap}>
            <FarmerListItem
              item={selectedFarmer}
              onClose={() => {
                setSelectedFarmer(null);
                setSelectedColor(null);
              }}
              avatarBgColor={selectedColor}
              displayClose
            />
          </View>
        )}

        <CustomButton
          buttonText={I18n.t('verify_with_photo')}
          onPress={() => handleSubmit(selectedFarmer)}
          extraStyle={{ width: '100%' }}
        />
      </View>
      {displayModal && selectedFarmer == null && (
        <Modal
          animationType="slide"
          transparent
          visible={displayModal}
          onRequestClose={() => setDisplayModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 58, 96, 0.2)' }}>
            <TouchableOpacity
              onPress={() => {
                setSelectedFarmer(null);
                setSelectedFarmer(null);
                setDisplayModal(false);
              }}
              style={{ height: '40%' }}
            />
            <View style={styles.searchFarmerWrap}>
              <SearchComponent
                placeholder={I18n.t('search_farmers')}
                onChangeText={(text) => onSearch(text)}
              />
              <FlatList
                data={farmersList}
                renderItem={renderItem}
                keyboardShouldPersistTaps="always"
                style={styles.flatListStyle}
                ListEmptyComponent={emptyComponent}
                keyExtractor={(item, index) => index.toString()}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      height,
      backgroundColor: '#ffffff',
      paddingHorizontal: width * 0.05,
    },
    formTitleContainer: {
      marginTop: 35,
      marginBottom: 20,
    },
    formTitle: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      textAlign: 'center',
    },
    noCardButton: {
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    scanning: {
      color: theme.text_1,
      fontWeight: 'normal',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 14,
      textAlign: 'center',
      marginVertical: 10,
    },
    errorMessage: {
      fontSize: 14,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.icon_error,
    },
    infoWrap: {
      backgroundColor: theme.text_2,
      flexDirection: 'row',
      width: '95%',
      paddingHorizontal: width * 0.05,
      paddingVertical: width * 0.02,
      alignSelf: 'center',
      borderRadius: theme.border_radius,
      zIndex: 99,
    },
    searchFarmerWrap: {
      height: '60%',
      marginTop: 'auto',
      backgroundColor: theme.background_1,
    },
    emptyList: {
      height: 100,
      width: '100%',
      justifyContent: 'center',
      alignSelf: 'center',
      alignItems: 'center',
      marginTop: 30,
      backgroundColor: theme.background_1,
    },
    flatListStyle: {
      flex: 1,
      marginHorizontal: 10,
      backgroundColor: theme.background_1,
    },
    selectedWrap: {
      width: '100%',
      alignSelf: 'center',
      marginBottom: 15,
    },
  });
};

export default NoCardMethod;
