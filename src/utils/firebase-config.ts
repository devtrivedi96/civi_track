export const validateFirebaseConfig = () => {
  const requiredEnvVars = [
    "AIzaSyCh0LnJSHAhJZkr1RM3hNnJHPm43I4q0p8",
    "civic-issue-sih-bac7e.firebaseapp.com",
    "civic-issue-sih-bac7e",
    "civic-issue-sih-bac7e.firebasestorage.app",
    "973217616582",
    "1:973217616582:web:34bbdbdcf8e99468a13dc7",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase configuration variables: ${missingVars.join(
        ", "
      )}`
    );
  }
};
