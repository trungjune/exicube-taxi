import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useTranslation } from "react-i18next";
import DriverEarning from './DriverEarning';
import Earningreports from './Earningreports';
import { useSelector } from "react-redux";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <div>{children}</div>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function AllReports() {
  const [value, setValue] = React.useState(0);
  const { t } = useTranslation();
  const auth = useSelector(state => state.auth);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
        {auth.profile.usertype === "fleetadmin" || auth.profile.usertype === "admin" ?
          <Tab style={{marginRight:"20px"}} label={t('driver_earning')} {...a11yProps(0)} />
        :null}
        {auth.profile.usertype === "admin" ?
          <Tab style={{marginRight:"20px"}} label={t('earning_reports')} {...a11yProps(1)} />
        :null}
        </Tabs>
      </Box>
        <TabPanel value={value} index={0}>
          <DriverEarning/>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Earningreports/>
        </TabPanel>
    </Box>
  );
}