const filterRequestBody = (validBodyKeys: Array<string>, requestBody: any) => {
  for (const key in requestBody) {
    if (!validBodyKeys.includes(key)) {
      throw new Error(`Invalid request body key: "${key}"`);
    }
  }

  return requestBody;
};

export default filterRequestBody;
