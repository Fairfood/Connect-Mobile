import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react-native';
import CustomButton from '../src/components/CustomButton';

afterEach(cleanup);

// ......... Testing CustomButton ...................

describe('testing CustomButton', () => {
    const onPressMock = jest.fn();
    const testIdName = 'CustomButton';

    it('checking CustomButton exist', () => {
        const { getByTestId } = render(
          <CustomButton
            buttonText='Enter username'
            onPress={onPressMock}
            testID={testIdName}
          />,
        );

        const foundButton = getByTestId(testIdName);
        expect(foundButton).toBeTruthy(); // expecting CustomButton is exists;
    });

    it('checking CustomButton onPress', () => {
        const { getByText } = render(
          <CustomButton
            buttonText='Enter username'
            onPress={onPressMock}
            testID={testIdName}
          />,
        );

        fireEvent.press(getByText('Enter username'));
        expect(onPressMock).toHaveBeenCalled(); // expecting onPress have been called;
    });
});
