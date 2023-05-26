import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, AppStateStatus, Button, StyleSheet, Text, View } from "react-native";
import { convertTimeToTimeStamp, delay, getCameraAssets, requestPermission } from "./src/utils";
import moment, { Moment } from "moment";
import { StorageService } from "./src/services/storage_service";
import { useAppState } from "./src/hooks";


interface IState {
  isLoading: boolean;
  isEventRunning: boolean;
  startTime: string | Moment;
}

function App() {
  const appState = useRef(AppState.currentState);
  const [state, setState] = useState({
    isLoading: false,
    isEventRunning: false,
    startTime: '',
  })

  useAppState(async (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('App has come to the foreground!');
      const isPermission = await requestPermission();
      const serviceObject = StorageService.getValue("service");
      if (serviceObject) {
        const startTime = serviceObject?.startTime
        const startTimeStamp = convertTimeToTimeStamp(startTime);
        if (isPermission && serviceObject?.isServiceRunning) {
          const result = await getCameraAssets((item: any) => {
            if (startTimeStamp <= item.timeStamp) {
              return true;
            }
            return false
          });
          console.log("AppState length", result.length);
          // updateState("data")(result);
        }
      }
    }
    appState.current = nextAppState;
    // console.log('AppState', appState.current);
  });

  useEffect(() => {
    init();
  }, []);

  function updateState(key: keyof typeof state) {
    return (value: IState[typeof key]) => {
      setState(prvValue => ({ ...prvValue, [key]: value }));
    }
  }

  async function init() {
    updateState("isLoading")(true);
    const isPermission = await requestPermission();
    const serviceObject = StorageService.getValue("service");
    if (serviceObject) {
      const startTime = serviceObject?.startTime
      const startTimeStamp = convertTimeToTimeStamp(startTime);
      if (isPermission && serviceObject?.isServiceRunning) {
        const result = await getCameraAssets((item: any) => {
          if (startTimeStamp <= item.timeStamp) {
            return true;
          }
          return false
        });
        console.log(result.length);
        // updateState("data")(result);
      }
      updateState("startTime")(startTime);
      updateState("isEventRunning")(serviceObject?.isServiceRunning);
    }
    updateState("isLoading")(false);
  }

  function toggleService() {
    if (state.isEventRunning) {
      // Stop the event
      StorageService.setValue("service", null);
      updateState("startTime")('');
      updateState("isEventRunning")(false);
    } else {
      // Start the event
      const startTime = moment();
      StorageService.setValue("service", {
        startTime,
        isServiceRunning: true,
      })
      updateState("startTime")(startTime);
      updateState("isEventRunning")(true);
    }
  }

  return (
    <View style={styles.container}>
      {
        state.isLoading ? <ActivityIndicator size="large" /> : <Button title={state.isEventRunning ? "Stop" : "Start"} onPress={toggleService} />
      }

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
});

export default App;