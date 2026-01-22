import { Button, Container, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function PublicThankYouPage() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 6 } }}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="h2">Thank you</Typography>
          <Typography color="text.secondary">Your response has been submitted.</Typography>
          <Button variant="outlined" component={RouterLink} to="/">
            Return home
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}
