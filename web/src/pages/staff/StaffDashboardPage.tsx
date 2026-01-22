import { Button, Card, CardContent, Container, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function StaffDashboardPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h2">Study hub</Typography>
          <Typography color="text.secondary">
            Manage studies, cohorts, and survey data.
          </Typography>
        </Stack>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h4">Quick actions</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" component={RouterLink} to="/app/preview">
                  Preview survey bundle
                </Button>
                <Button variant="outlined" component={RouterLink} to="/app/surveys">
                  Manage surveys
                </Button>
                <Button variant="outlined" component={RouterLink} to="/app/cohorts">
                  Manage cohorts
                </Button>
                <Button variant="outlined" component={RouterLink} to="/app/responses">
                  View responses
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h4">Surveys</Typography>
            <Typography color="text.secondary">
              Build new surveys, manage templates, and edit structure.
            </Typography>
            <Button
              sx={{ mt: 2 }}
              variant="outlined"
              component={RouterLink}
              to="/app/surveys/new"
            >
              Create survey
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h4">Cohorts</Typography>
            <Typography color="text.secondary">
              Track study runs, create links, and share QR codes.
            </Typography>
            <Button
              sx={{ mt: 2 }}
              variant="outlined"
              component={RouterLink}
              to="/app/cohorts/new"
            >
              Create cohort
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
}
