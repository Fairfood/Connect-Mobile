import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import I18n from '../../translations/text/i18n';
import StyleSheetFactory from './styles';
import { HIT_SLOP_TEN } from '../../utils/constants';
import { updateSpeechEnabled } from '../../redux/CommonStore';
import { RightArrowIcon } from '../../assets/svg';

const Languages = { 'en-GB': 'English', 'id-ID': 'Indonesian' };

export const LanguageMenu = ({ navigation }) => {
  const styles = StyleSheetFactory();
  const { theme } = useSelector((state) => state.common);
  const [appLanguage, setAppLanguage] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setupInitialValues();
      return () => {};
    }, []),
  );

  /**
   * setting current language
   */
  const setupInitialValues = async () => {
    const language = await AsyncStorage.getItem('app_language');
    setAppLanguage(Languages[language]);
  };

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('ChangeLanguage')}
      style={styles.listItem}
    >
      <View style={styles.listMainItem}>
        <Text style={styles.listItemLeft}>{I18n.t('language')}</Text>
      </View>
      <View style={styles.listItemRightIcon}>
        <Text style={styles.rightTextStyle}>{appLanguage}</Text>
        <RightArrowIcon stroke={theme.background_3} />
      </View>
    </TouchableOpacity>
  );
};

export const TextToSpeechMenu = () => {
  const styles = StyleSheetFactory();
  const { theme, speechEnabled } = useSelector((state) => state.common);
  const dispatch = useDispatch();

  /**
   * enable/disable audio speech feature
   */
  const updateTextToSpeech = () => {
    dispatch(updateSpeechEnabled(!speechEnabled));
  };

  return (
    <View style={styles.listItemSub}>
      <View>
        <Text style={styles.listItemLeft}>{I18n.t('text_to_speech')}</Text>
        <Text style={styles.listSubItemLeft}>
          {I18n.t('speech_amount_desc')}
        </Text>
      </View>
      <TouchableOpacity
        onPress={updateTextToSpeech}
        style={[
          styles.toggleOuter,
          {
            backgroundColor: speechEnabled ? theme.text_2 : theme.border_1,
            justifyContent: speechEnabled ? 'flex-end' : 'flex-start',
          },
        ]}
        hitSlop={HIT_SLOP_TEN}
      >
        <View style={styles.toggleInner} />
      </TouchableOpacity>
    </View>
  );
};

export const NumberFormatMenu = ({ navigation }) => {
  const styles = StyleSheetFactory();
  const { theme } = useSelector((state) => state.common);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('ChangeNumberFormat')}
      style={styles.listItem}
    >
      <View style={styles.listMainItem}>
        <Text style={styles.listItemLeft}>Number format</Text>
      </View>
      <View style={styles.listItemRightIcon}>
        <RightArrowIcon stroke={theme.background_3} />
      </View>
    </TouchableOpacity>
  );
};
