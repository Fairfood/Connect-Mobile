import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react-native';
import CustomTextInput from '../src/components/CustomTextInput';

afterEach(cleanup);

// ......... Testing CustomTextInput ..................

describe('testing CustomTextInput', () => {
    const onChangeTextMock = jest.fn();
    const placeholderText = 'username';

    it('testing CustomTextInput', () => {
        const { getByPlaceholderText } = render(
          <CustomTextInput
            placeholder={placeholderText}
            value={placeholderText}
            onChangeText={onChangeTextMock}
          />,
        );

        const foundHeader = getByPlaceholderText(placeholderText);
        expect(foundHeader).toBeTruthy(); // expecting CustomTextInput is exists;
    });

    it('testing CustomTextInput', () => {
        const { getByPlaceholderText } = render(
          <CustomTextInput
            placeholder={placeholderText}
            value={placeholderText}
            onChangeText={onChangeTextMock}
          />,
        );

        fireEvent.changeText(getByPlaceholderText(placeholderText), 'test user');
        expect(onChangeTextMock).toHaveBeenCalled(); // expecting changeText have been called;
    });
});
