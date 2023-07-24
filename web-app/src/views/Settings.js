import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useTranslation } from "react-i18next";
import AppInformation from './AppInformation';
import GeneralSettings from './GeneralSettings';
import LanguageSetting from './LanguageSetting';
import SMTPSettings from './SMTPSettings';

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

export default function Settings() {
  const [value, setValue] = React.useState(0);
  const { t } = useTranslation();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab style={{marginRight:"20px"}} label={t('app_info')} {...a11yProps(0)} />
          <Tab style={{marginRight:"20px"}} label={t('general_settings')} {...a11yProps(1)} />
          <Tab style={{marginRight:"20px"}} label={t('language')} {...a11yProps(2)} />
          <Tab style={{marginRight:"20px"}} label={t('smtp')} {...a11yProps(3)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <AppInformation/>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <GeneralSettings/>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <LanguageSetting/>
      </TabPanel>
      <TabPanel value={value} index={3}>
        <SMTPSettings/>
      </TabPanel>
    </Box>
  );
}