import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Keyboard,
  BackHandler,
} from 'react-native';
import { useSelector } from 'react-redux';
import CustomLeftHeader from '../../../components/headers/customLeftHeader';
import Countries from '../../../utils/countries';
import I18n from '../../../translations/text/i18n';
import StepOne from '../../../components/addFarmer/stepOne';
import StepTwo from '../../../components/addFarmer/stepTwo';
import StepThree from '../../../components/addFarmer/stepThree';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');

const AddNewFarmer = ({ navigation }) => {
  const addFarmerScrollRef = useRef();
  const { theme } = useSelector((state) => state.common);
  const [stepper, setStepper] = useState(1);
  const [farmer, setFarmer] = useState({});
  const [countriesList, setCountriesList] = useState([]);
  const [allCountriesList, setAllCountriesList] = useState([]);
  const styles = StyleSheetFactory();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => backHandler.remove();
  }, [stepper]);

  const handleBackPress = () => {
    backNavigation();
    return true;
  };

  useEffect(() => {
    setupCountryList();
  }, []);

  /**
   * setting country list
   */
  const setupCountryList = async () => {
    const arrayOfObj = Object.entries(Countries.data).map(
      ([countryData, additionalData]) => ({
        label: countryData,
        additional: additionalData,
        value: countryData,
      }),
    );

    setCountriesList([...arrayOfObj]);
    setAllCountriesList([...arrayOfObj]);
  };

  /**
   * on back navigation pages are scrolled to backwards
   */
  const backNavigation = () => {
    if (stepper === 1) {
      navigation.goBack(null);
    } else {
      addFarmerScrollRef.current.scrollTo({
        x: (stepper - 2) * width,
        y: 0,
        animated: true,
      });
      setStepper(stepper - 1);
    }
  };

  /**
   * each page submission farmer details updated and scrolled to forward
   * @param {object} obj farmer details object
   */
  const onNext = (obj) => {
    Keyboard.dismiss();

    if (stepper < 3) {
      if (stepper === 1) {
        setFarmer({ ...farmer, ...obj });
        setStepper(stepper + 1);
        addFarmerScrollRef.current.scrollTo({
          x: 1 * width,
          y: 0,
          animated: true,
        });
      } else {
        addFarmerScrollRef.current.scrollTo({
          x: 2 * width,
          y: 0,
          animated: true,
        });
        setFarmer({ ...farmer, ...obj });
        setStepper(stepper + 1);
      }
    } else if (stepper === 3) {
      setFarmer({ ...farmer, ...obj });
    }
  };

  const onAddFarmer = () => {
    navigation.navigate('IssueFarmerCard', { farmer, newFarmer: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        title={I18n.t('add_new_farmer')}
        onPress={backNavigation}
        extraStyle={{ paddingHorizontal: 25 }}
        testID="add-farmer-header"
      />

      <Steps stepper={stepper} styles={styles} theme={theme} />

      <ScrollView
        ref={addFarmerScrollRef}
        keyboardShouldPersistTaps="handled"
        pagingEnabled
        horizontal
        scrollEnabled={false}
        showsVerticalScrollIndicator
        automaticallyAdjustContentInsets={false}
        showsHorizontalScrollIndicator={false}
      >
        {stepper === 1 && (
          <StepOne onNext={onNext} farmer={farmer} theme={theme} />
        )}

        {stepper === 2 && (
          <StepTwo
            onNext={onNext}
            farmer={farmer}
            countriesList={countriesList}
            allCountriesList={allCountriesList}
            theme={theme}
          />
        )}

        {stepper === 3 && (
          <StepThree
            onNext={onNext}
            farmer={farmer}
            onAddFarmer={onAddFarmer}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Steps = ({ stepper, styles, theme }) => {
  const defaultColor = theme.background_1;

  const RoundView = ({
    pageCount,
    outerBg,
    innerBg,
    innerBorder,
    textColor,
  }) => (
    <View style={[styles.stepContainerSub, { backgroundColor: outerBg }]}>
      <View
        style={[
          styles.selectedView,
          {
            backgroundColor: innerBg,
            borderColor: innerBorder,
          },
        ]}
      >
        <Text style={[styles.selectedText, { color: textColor }]}>
          {pageCount}
        </Text>
      </View>
    </View>
  );

  const LineView = ({ borderTopColor, borderTopWidth }) => {
    return (
      <View
        style={[styles.horizontalLine, { borderTopColor, borderTopWidth }]}
      />
    );
  };

  return (
    <View style={styles.stepContainer}>
      {[1, 2, 3].map((i, n) => (
        <View key={n.toString()} style={styles.stepWrapper}>
          <RoundView
            pageCount={i}
            outerBg={stepper >= i ? '#C5EDFA' : defaultColor}
            innerBg={stepper >= i ? '#4DCAF4' : defaultColor}
            innerBorder={stepper >= i ? '#4DCAF4' : '#C5EDFA'}
            textColor={stepper >= i ? defaultColor : '#5691AE'}
          />
          {n !== 2 && (
            <LineView
              borderTopColor={stepper > i ? '#C5EDFA' : '#BDBDBD'}
              borderTopWidth={stepper <= i ? 1 : 3}
            />
          )}
        </View>
      ))}
    </View>
  );
};

export default AddNewFarmer;
