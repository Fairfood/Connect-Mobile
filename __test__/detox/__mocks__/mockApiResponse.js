import AsyncStorage from '@react-native-async-storage/async-storage';

// const emptySuccessArray = { success: true, data: [], error: null };
const emptySuccessObject = { success: true, data: {}, error: null };
const emptySErrorResp = { success: false, data: {}, error: 'No content found' };

export const getMockApiResponse = async (testingKey) => {
  const data = await JSON.parse(AsyncStorage.getItem(testingKey) || 'null');
  if (data) {
    return { success: true, data, error: null };
  }

  switch (testingKey) {
    case '_server_handshake':
      return emptySuccessObject;
    default:
      return emptySErrorResp;
  }
};
