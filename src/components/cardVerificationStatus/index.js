import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { NFCVerifyIcon, QRVerifyIcon } from '../../assets/svg';

const { width } = Dimensions.get('window');

const itemStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 7,
  marginRight: 5,
  borderRadius: 6,
};

const activeItemStyle = {
  backgroundColor: '#4DCAF4',
};

const inActiveItemStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#809CAF',
  borderWidth: 1,
};
const textStyle = {
  fontSize: 15,
  marginLeft: 5,
};

const activeTextStyle = {
  color: '#ffffff',
};

const inActiveTextStyle = {
  color: '#809CAF',
};

const CardVerificationStatus = ({ cardId, displayId }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
      <View style={[itemStyle, cardId ? activeItemStyle : inActiveItemStyle]}>
        <View
          style={{
            width: width * 0.05,
            height: width * 0.05,
            borderRadius: (width * 0.05) / 2,
            backgroundColor: cardId ? '#fff' : '#ddd',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <NFCVerifyIcon
            width={width * 0.03}
            height={width * 0.03}
            fill={cardId ? '#4DCAF4' : '#fff'}
          />
        </View>
        <Text style={[textStyle, cardId ? activeTextStyle : inActiveTextStyle]}>
          NFC Card
        </Text>
      </View>
      <View
        style={[itemStyle, displayId ? activeItemStyle : inActiveItemStyle]}
      >
        <View
          style={{
            width: width * 0.05,
            height: width * 0.05,
            borderRadius: (width * 0.05) / 2,
            backgroundColor: displayId ? '#fff' : '#ddd',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <QRVerifyIcon
            width={width * 0.03}
            height={width * 0.03}
            fill={displayId ? '#4DCAF4' : '#fff'}
          />
        </View>
        <Text
          style={[textStyle, displayId ? activeTextStyle : inActiveTextStyle]}
        >
          QR Card
        </Text>
      </View>
    </View>
  );
};

export default CardVerificationStatus;
