import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

class TabsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[Tabs] render error', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FDFBF7',
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Inter-SemiBold',
              color: '#1A1A2E',
              marginBottom: 8,
            }}
          >
            Loading VEYa...
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Inter-Regular',
              color: '#6B6B80',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            If this keeps happening, tap to retry.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={{
              backgroundColor: '#8B5CF6',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 18,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Inter-Medium' }}>
              Retry
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function TabLayout() {
  return (
    <TabsErrorBoundary>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#8B5CF6',
          tabBarInactiveTintColor: '#9B9BAD',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: 'rgba(0, 0, 0, 0.06)',
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 88 : 64,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: 'Inter-Medium',
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Ionicons name="sunny" size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rituals"
        options={{
          title: 'Rituals',
          tabBarIcon: ({ color, size }) => <Ionicons name="moon" size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size || 22} color={color} />,
        }}
      />
      </Tabs>
    </TabsErrorBoundary>
  );
}
