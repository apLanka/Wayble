import {api} from "@packages/backend/convex/_generated/api";
import {useMutation, useQuery} from "convex/react";
import {Button, StyleSheet, Text, View} from "react-native";

export default function DebugScreen() {
    const health = useQuery(api.health.ping);
    const touch = useMutation(api.health.touch);

    if (health === undefined) {
        return (
            <View style={styles.container}>
                <Text>Connecting to Convex…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text>Server time: {new Date(health.serverTime).toISOString()}</Text>
            <Text>Counter: {health.count}</Text>
            <Button
                title="Touch"
                onPress={() => void touch()}
                accessibilityLabel="Increment the health counter"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
});
