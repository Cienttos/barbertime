import * as userRepository from "../repositories/user.repository.js";

export const updateUserRole = async (id, role) => {
  const user = await userRepository.updateUserRole(id, role);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};