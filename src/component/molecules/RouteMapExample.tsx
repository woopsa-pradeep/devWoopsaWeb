import React from 'react';
import { Box, Typography } from '@mui/material';
import RouteMap from './RouteMap';

/**
 * Example usage of RouteMap component
 * This shows how to use the RouteMap component with your API response data
 */
const RouteMapExample: React.FC = () => {
  // Example API response data
  const apiResponse = {
    success: true,
    message: 'Deliver route by google map fetched successfully',
    data: {
      route: {
        polyline:
          'u|qsEbxpvNKOGq@Mu@Om@a@wAGImAwEs@_C}@{CiAgEo@eCeAeDWy@KUa@mAoByEG[y@qBaCwF_AyB}@dAeCrCs@z@e@l@q@r@e@b@g@`@g@TUF{@LoEPqANuCb@cBFe@?mAImAMeASkAWqASo@G}AAe@DgEb@q@Dy@BqAAqAGcBMcFo@eBIqADu@Jo@N_Bl@oBz@{DbBoBj@cDv@kAZ{@Za@XORu@|AyAvCaBbDg@p@OnAUlAi@xBi@`Bw@tBmA|CkC|Gy@rBgCxG_@|AOxAGrBFvARbBbCxLf@fCf@rDZ|DTdFd@fLNhDH`APnA`@zAn@tAv@fAjBfBpArAv@bAl@~@R\\t@`BjA~D|@~CVbAdBlGHh@BN`@jAR~AHpA?nAIxDYdNa@fVi@Ia@CIDS`@w@nEYlAM`@SXs@fAW^o@`AsArB}BrDSVu@n@gBhAiBdAo@n@{@`Bc@p@cAjA[\\iCpC]^k@`@QF[FkANs@Nq@VSLc@`@a@j@aAvAkCdEcDhFeAhBMb@Qv@[rDE~@Ah@BzAVpD@tAOpE]|ICp@@dBJ~@zBlG`E`LRl@fAnFhAtFPn@b@jApAnCbDnHh@~ARrADvAAnAQbHOdGi@zTCpB@hBDtALbCx@~Mn@vJTzARz@|@hCNt@F`@BfACfASzAi@tDSfASv@iA|CiAnCm@`Bk@zAe@dAWOk@Qe@Cg@BqATgB`@}GvAgDt@eBf@sDhAuBh@_AFa@?w@I_AWi@YyAiAaAs@cA[o@GkBIgAGoCI{FOmEAeEBcBD}APmAXoCv@eAVmA^eCj@iARmCZkIv@eBaL@a@FQn@]o@\\GPA`@l@nDv@pFdCWdE_@lC[hASdCk@lA_@dAWlA]`AYlAY|AQ^APf@DL~@zCl@vB\\tAZvBDj@HlBAjBE|AOzB_@dH_@xHEbC@tAHjBTjCX~Ax@bDdBbFpBzFDPLOt@sBXo@jAsB~AgCrAkBl@q@j@y@xBkCrCgDt@gA^m@Vs@\\oARiA?K[Mk@Qg@QiAYuB_@oB}@gAa@sAc@rAb@fA`@l@X`Ab@`@HdAPt@PhA\\j@PZL?JShAG\\m@dBaA|Ao@v@cCtCk@t@aAfA]h@e@h@a@f@aB~B}AdC_AhBi@pAYx@MN?PI`@g@jCM`AUdCEjB?dAHrB@Z?vG?nDE|CO|@{BY{Ec@iMgAsMgAoe@aEkBOiBMwBIwC@cCRmBVaAPuOxDmPbE{@RkB^i@Di@D{@?uAE_BUm@MyEkBoHwCeEeB{Ay@}A{@',
        totalDistanceKm: 23.29,
        lastStopToDestinationKm: 5.087,
      },
      optimizedStops: [
        {
          stopSequence: 1,
          C_Number: 34008,
          orderNumbers: 123122,
          lat: 34.8798872,
          lng: -82.5828101,
          distanceKm: 14.804,
          cumulativeDistanceKm: 14.804,
        },
        {
          stopSequence: 2,
          C_Number: 12345,
          orderNumbers: 123223,
          lat: 34.8700154,
          lng: -82.5903589,
          distanceKm: 3.401,
          cumulativeDistanceKm: 18.205,
        },
      ],
      waypointOrder: [1, 0],
    },
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Route Map Example (No Google API)
      </Typography>
      <Typography variant="body2" sx={{ marginBottom: 2, color: 'text.secondary' }}>
        This map uses Leaflet with OpenStreetMap tiles - no API key required!
      </Typography>
      <Box sx={{ height: '600px', border: '1px solid #ddd', borderRadius: 2, overflow: 'hidden' }}>
        <RouteMap
          route={apiResponse.data.route}
          optimizedStops={apiResponse.data.optimizedStops}
          height="100%"
          width="100%"
          showInfoPanel={true}
        />
      </Box>
    </Box>
  );
};

export default RouteMapExample;
