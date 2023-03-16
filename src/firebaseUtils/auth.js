import firebase from "firebase/compat/app";

export const handleSignIn = async setIsLoggedIn => {
  // Retrieve Google provider object
  const provider = new firebase.auth.GoogleAuthProvider();
  // Set language to the default browser preference
  firebase.auth().useDeviceLanguage();
  // Start sign in process
  try {
    const response = await firebase.auth().signInWithPopup(provider);
    console.log("signed in", response)
    setIsLoggedIn(true)
  } catch (error) {
    console.log(error.message);
  }
};

export const handleSignOut = async setIsLoggedIn => {
  try {
    await firebase.auth().signOut();
    setIsLoggedIn(false);
  } catch (error) {
    console.log(error.message);
  }
};
