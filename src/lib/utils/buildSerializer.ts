export function exportBuildToJson(build: any) {
  return JSON.stringify(build);
}

export function importBuildFromJson(json: string) {
  try {
    return JSON.parse(json);
  } catch (err) {
    throw new Error('Invalid JSON');
  }
}

