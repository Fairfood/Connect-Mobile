import React from 'react';
import { cleanup, render } from '@testing-library/react-native';
import StyleTest from '../__unit_tests__/components/styletest';

afterEach(cleanup);

// ......... Testing Common Styles ..................

describe('testing StyleTest', () => {
    it('testing single style property constant color', () => {
        const { getByTestId } = render(<StyleTest />);

        const foundBodyElement = getByTestId('body');
        expect(foundBodyElement.props.style.backgroundColor).toEqual('#FFFFFF');
    });

    it('testing whole style property', () => {
        const { getByText } = render(<StyleTest />);

        const foundSectionTitle = getByText('Hello World!');

        expect(foundSectionTitle).toHaveStyle({
            fontSize: 24,
            fontWeight: '600',
            color: '#EA2353',
        });
    });
});
