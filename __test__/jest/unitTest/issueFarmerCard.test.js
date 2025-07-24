import { createSubmissions } from '../../../src/screens/farmers/issueFarmerCard/controller';

describe('createSubmissions validation', () => {
  it('returns empty submissions when forms is null', async () => {
    const result = await createSubmissions(null);
    expect(result).toEqual([]);
  });

  it('returns empty submissions when forms is undefined', async () => {
    const result = await createSubmissions(undefined);
    expect(result).toEqual([]);
  });

  it('returns empty submissions when forms is an empty array', async () => {
    const result = await createSubmissions([]);
    expect(result).toEqual([]);
  });

  it('returns empty submissions when forms do not have fields with values', async () => {
    const forms = [
      {
        id: 'form_1',
        fields: [{ id: 'field_1', value: '', label: 'field_1_label' }],
      },
      { id: 'form_2', fields: [] },
    ];
    const result = await createSubmissions(forms);
    expect(result).toEqual([]);
  });

  it('returns submissions when forms have fields with values', async () => {
    const forms = [
      {
        id: 'form_1',
        fields: [
          { id: 'field_1', value: 'value', label: 'field_1_label' },
          { id: 'field_2', value: 'value', label: 'field_2_label' },
        ],
      },
      {
        id: 'form_2',
        fields: [{ id: 'field_1', value: '', label: 'field_1_label' }],
      },
      { id: 'form_3', fields: [] },
    ];
    const result = await createSubmissions(forms);
    expect(result).toEqual([
      {
        form: 'form_1',
        values: [
          {
            field: 'field_1',
            field_details: { id: 'field_1', value: 'value', label: 'field_1_label' },
            value: 'value',
          },
          {
            field: 'field_2',
            field_details: { id: 'field_2', value: 'value', label: 'field_2_label' },
            value: 'value',
          },
        ],
      },
    ]);
  });
});
