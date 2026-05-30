import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "perfil";

export async function getPerfil() {
  const data = await AsyncStorage.getItem(KEY);
  return data
    ? JSON.parse(data)
    : {
        nombre: "",
        email: "",
        telefono: "",
        foto: null,
      };
}

export async function savePerfil(perfil) {
  await AsyncStorage.setItem(KEY, JSON.stringify(perfil));
  return perfil;
}
