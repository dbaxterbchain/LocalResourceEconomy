import { Container, Paper, Stack, Typography } from '@mui/material'

type PlaceholderPageProps = {
  title: string
  description?: string
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={1.5}>
          <Typography variant="h2">{title}</Typography>
          {description ? <Typography color="text.secondary">{description}</Typography> : null}
        </Stack>
      </Paper>
    </Container>
  )
}
