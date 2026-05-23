const matchers = require('@testing-library/react-native/matchers')

expect.extend(matchers)

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text } = require('react-native')

  const MockIcon = ({ name, testID }) =>
    React.createElement(Text, { testID, accessibilityLabel: name }, '')

  return new Proxy(
    {},
    {
      get: () => MockIcon,
    },
  )
})
