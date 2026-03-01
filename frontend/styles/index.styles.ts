import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  
  greeting: {
  fontSize: 16,
  opacity: 0.7,
  marginBottom: 4,
  
},
  
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 48,
  },

  tagline: {
    opacity: 0.6,
    fontSize: 16,
    marginTop: 4,
  },

  scanSection: {
    alignItems: 'center',
    marginBottom: 12,
  },

  scanButton: {
    backgroundColor: '#0a7ea4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    maxWidth: 300,
  },

  scanButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  infoSection: {
    backgroundColor: 'rgba(10, 126, 164, 0.08)',
    padding: 20,
    borderRadius: 16,
  },

  infoTitle: {
    fontSize: 16,
    marginBottom: 16,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },

  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0a7ea4',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },

  stepText: {
    flex: 1,
    fontSize: 15,
  },

  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(10, 126, 164, 0.3)',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    marginBottom: 12,
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },

  disabledButton: {
    opacity: 0.4,
  },

  orText: {
    textAlign: 'center',
    opacity: 0.5,
    marginVertical: 8,
  },
});
