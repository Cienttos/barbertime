import * as generalRepository from "../repositories/general.repository.js";

export const getGeneralData = async () => {
  return await generalRepository.getGeneralData();
};

export const updateGeneralData = async (settings) => {
  return await generalRepository.updateGeneralData(settings);
};