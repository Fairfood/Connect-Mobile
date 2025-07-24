import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { HIT_SLOP_FIFTEEN } from '../../../utils/constants';
import StyleSheetFactory from './styles';

const CustomHeader = ({ title, onPressRight, testID = '' }) => {
  const styles = StyleSheetFactory();
  const { syncIconStatus } = useSelector((state) => state.sync);

  const getSyncStatus = useMemo(() => {
    switch (syncIconStatus) {
      case 'success':
        return require('../../../assets/images/sync_success.png');
      case 'pending':
        return require('../../../assets/images/sync_pending.png');
      case 'failed':
        return require('../../../assets/images/sync_error.png');
      default:
        return require('../../../assets/images/sync_pending.png');
    }
  }, [syncIconStatus]);

  return (
    <View style={styles.container}>
      <Text style={styles.headerText} testID={testID}>
        {title}
      </Text>

      <TouchableOpacity
        style={styles.rightIcon}
        onPress={onPressRight}
        hitSlop={HIT_SLOP_FIFTEEN}
      >
        <Image
          style={styles.tinyLogo}
          source={getSyncStatus}
          testID="sync-icon"
        />
      </TouchableOpacity>
    </View>
  );
};

export default memo(CustomHeader);
