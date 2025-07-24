import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, SafeAreaView, Image } from 'react-native';
import { useSelector } from 'react-redux';
import CustomButton from '../../../../components/buttons/customButton';
import I18n from '../../../../translations/text/i18n';
import HelpTutorial from '../../../../components/modals/helpTutorial';
import StyleSheetFactory from './styles';
import DashboardHeader from '../../../../components/headers/dashboardHeader';

const HelpTutorialScreen = ({ navigation }) => {
  const [helpModal, setHelpModal] = useState(true);
  const { userCompanyDetails } = useSelector((state) => state.login);
  const { theme } = useSelector((state) => state.common);
  const styles = useMemo(() => StyleSheetFactory(theme), [theme]);

  const closeModal = useCallback(() => {
    setHelpModal(false);
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <DashboardHeader />
        <Image
          source={require('../../../../assets/images/lines.png')}
          style={styles.linesImage}
        />
      </View>
      {/* Click receive or deliver to start a transaction */}
      {userCompanyDetails?.sell_enabled && (
        <Text style={[styles.buyText]}>{I18n.t('greeting')}</Text>
      )}
      {!userCompanyDetails?.sell_enabled && (
        <Text style={[styles.buyText, { textAlign: 'center' }]}>
          {I18n.t('greeting_with_buy')}
        </Text>
      )}

      {userCompanyDetails?.buy_enabled && (
        <View style={styles.buyButtonWrap}>
          <CustomButton buttonText={I18n.t('buy')} medium onPress={() => {}} />
        </View>
      )}
      {userCompanyDetails?.sell_enabled && (
        <View style={styles.sellButtonWrap}>
          <CustomButton
            buttonText={I18n.t('sell')}
            medium
            onPress={() => {}}
            backgroundColor={theme.background_1}
          />
        </View>
      )}

      {helpModal && <HelpTutorial visible={helpModal} hideModal={closeModal} />}
    </SafeAreaView>
  );
};

export default HelpTutorialScreen;
