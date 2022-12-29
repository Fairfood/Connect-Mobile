import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react-native';
import CustomHeader from '../src/components/CustomHeader';

afterEach(cleanup);

// ......... Testing CustomHeader ......................

describe('testing CustomHeader', () => {
    const onPressRightMock = jest.fn();
    const onPressMock = jest.fn();

    const rightText = 'Right Text';
    const leftText = 'Left Text';

    it('testing CustomHeader exist', () => {
        const { getByTestId } = render(
          <CustomHeader
            title='edit farmer'
            rightText={rightText}
            testID={rightText}
          />,
        );

        const foundHeader = getByTestId(rightText);
        expect(foundHeader).toBeTruthy(); // expecting CustomButton is exists;
    });

    it('testing onPressRight', () => {
        const { getByTestId } = render(
          <CustomHeader
            title='edit farmer'
            onPressRight={onPressRightMock}
            rightText={rightText}
            testID={rightText}
          />,
        );

        fireEvent.press(getByTestId(rightText));
        expect(onPressRightMock).toHaveBeenCalled(); // expecting onPressRight have been called;
    });

    it('testing onPress', () => {
        const { getByTestId } = render(
          <CustomHeader
            title='edit farmer'
            onPress={onPressMock}
            leftText={leftText}
            testID={leftText}
          />,
        );

        fireEvent.press(getByTestId(leftText));
        expect(onPressMock).toHaveBeenCalled(); // expecting onPress have been called;
    });
});
