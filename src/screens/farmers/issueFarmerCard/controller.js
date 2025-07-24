/**
 * creating form submission
 * @param   {Array} forms  extra fields
 * @returns {Array}        submission array
 */
export const createSubmissions = async (forms) => {
  const submissions = [];

  if (!forms) {
    return [];
  }

  for (const form of forms) {
    const values = form.fields.filter((x) => x.value && x.value !== '');
    const valueObj = values.map((val) => {
      return { field: val.id, field_details: val, value: val.value };
    });
    if (valueObj.length > 0) {
      submissions.push({ form: form.id, values: valueObj });
    }
  }

  return submissions;
};
