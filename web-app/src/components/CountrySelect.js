/* eslint-disable no-use-before-define */
import React from 'react';
import TextField from '@mui/material/TextField';
import { Autocomplete } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTranslation } from "react-i18next";
import Box from '@mui/material/Box';

const useStyles = makeStyles({
  option: {
    fontSize: 15,
    '& > span': {
      marginRight: 10,
      fontSize: 18,
    },
  },
  rootRtl_1:{
    "& label": {
      right: 75,
      left: "auto"
    },
    "& legend": {
      textAlign: "right",
      marginRight:60
    }
  },
});

export default function CountrySelect(props) {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir();
  const classes = useStyles();

  return (
    <Autocomplete
      id="country-select-demo"
      style={{ width: '100%',...props.style }}
      options={props.countries}
      classes={{
        option: classes.option,
      }}
      autoHighlight
      getOptionLabel={(option) => `${option.label} +${option.phone}`}
      
      renderOption={(props, option) => (
        <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
          <img
            loading="lazy"
            width="20"
            src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
            srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
            alt=""
          />
          {option.label} ({option.code}) +{option.phone}
        </Box>
      )}
      disabled={props.disabled}
      onChange={props.onChange}
      value={props.value}
      disableClearable={props.dis}
      renderInput={(params) => (
        <TextField
          {...params}
          label={props.label}
          className={isRTL ==="rtl"? classes.rootRtl_1:null}
          style={{direction:isRTL === 'rtl'?'rtl':'ltr'}}
          variant="outlined"
          inputProps={{
            ...params.inputProps,
            autoComplete: 'new-password'
          }}
          
        />
      )}
    />         
  );
}