import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { Grid } from '@mui/material';

function CircularLoading() {

  return (
    <Grid
      container
      spacing={0}
      alignItems="center"
      justifyContent={'center'}
      style={{ minHeight: '100vh' }}
    >
      <CircularProgress/>
    </Grid>
  )
}

export default CircularLoading;