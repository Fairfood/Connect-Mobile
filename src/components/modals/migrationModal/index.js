/**
 * Dummy migration file.
 * Keep change when ever migration modal needed.
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import * as Progress from 'react-native-progress';
import I18n from '../../../translations/text/i18n';
import CustomButton from '../../buttons/customButton';
import ToastConfig from '../../toastConfig';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');
const migrationFinalStage = 5;
const migrationSyncStage = 1;

const MigrationModal = ({ visible, onSubmit }) => {
  const styles = StyleSheetFactory();
  const { theme } = useSelector((state) => state.common);

  const FieldView = ({ active, title, message, message2, message3 }) => {
    return (
      <View style={styles.subContainer}>
        <View style={styles.radioWrap}>
          <View
            style={[
              styles.radio,
              {
                backgroundColor: active ? theme.radio_2 : '#eeeeee',
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.mainContentWrap,
            { borderBottomWidth: 0, paddingBottom: 0 },
          ]}
        >
          <View style={styles.progressBarTitleWrap}>
            <Text style={styles.progressBarTitle}>{title}</Text>
          </View>
          <Text style={[styles.messageText2, { marginTop: 0 }]}>{message}</Text>
          {message2 ? (
            <Text
              style={[
                styles.messageText2,
                { marginTop: 0, fontFamily: theme.font_bold },
              ]}
            >
              {message2}
            </Text>
          ) : null}
          {message3 ? (
            <Text style={[styles.messageText2, { marginTop: 0 }]}>
              {message3}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={() => {}}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topSection}>
          <ImageBackground
            source={require('../../../assets/images/alert_bg.png')}
            style={styles.imageWrap}
          >
            <Image
              source={require('../../../assets/images/migration.gif')}
              style={styles.imageWrapSub}
            />
          </ImageBackground>
        </View>
        <View style={styles.contentWrap}>
          <Text style={styles.titleText}>{I18n.t('db_migration')}</Text>

          {migrationSyncStage === migrationFinalStage ? (
            <Text style={styles.messageText3}>
              {I18n.t('db_migration_msg_3')}
            </Text>
          ) : (
            <Text style={styles.messageText1}>
              {I18n.t('db_migration_msg_1')}
            </Text>
          )}

          <View style={styles.mainContentWrap}>
            <View style={styles.progressBarTitleWrap}>
              <Text style={styles.progressBarTitle}>
                {migrationSyncStage &&
                migrationSyncStage === migrationFinalStage
                  ? I18n.t('db_migration_completed')
                  : I18n.t('db_migrating')}
              </Text>
              <Text style={styles.progressBarPercentage}>
                {`${migrationSyncStage ?? 1} / ${migrationFinalStage}`}
              </Text>
            </View>
            <Progress.Bar
              progress={
                migrationSyncStage
                  ? migrationSyncStage / migrationFinalStage
                  : 1 / migrationFinalStage
              }
              width={width * 0.79}
              height={8}
              color="#27AE60"
            />
            {migrationSyncStage !== migrationFinalStage && (
              <Text style={styles.messageText2}>
                {I18n.t('db_migration_msg_2')}
              </Text>
            )}
          </View>

          <FieldView
            active
            title={I18n.t('sync_msg_title_1')}
            message={I18n.t('sync_msg_1')}
          />

          <FieldView
            active={migrationSyncStage >= 2}
            title={I18n.t('sync_msg_title_2')}
            message={I18n.t('sync_msg_2')}
          />

          <FieldView
            active={migrationSyncStage >= 3}
            title={I18n.t('sync_msg_title_3')}
            message={`${I18n.t('sync_msg_3')}`}
            message2={'lang'}
            message3={I18n.t('sync_msg_4')}
          />

          <View style={styles.buttonWrap}>
            <CustomButton
              buttonText={I18n.t('logout')}
              onPress={onSubmit}
              extraStyle={{
                width: '100%',
                alignSelf: 'center',
                borderColor:
                  migrationSyncStage === migrationFinalStage
                    ? theme.button_bg_1
                    : '#eeeeee',
              }}
              backgroundColor={
                migrationSyncStage === migrationFinalStage
                  ? theme.button_bg_1
                  : '#eeeeee'
              }
              disabled={migrationSyncStage !== migrationFinalStage}
            />
          </View>
        </View>
      </ScrollView>
      <Toast config={ToastConfig} visibilityTime={5000} />
    </Modal>
  );
};

export default MigrationModal;
