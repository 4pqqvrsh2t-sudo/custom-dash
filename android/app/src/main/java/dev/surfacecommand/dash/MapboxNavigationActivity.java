package dev.surfacecommand.dash;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.mapbox.geojson.Point;
import com.mapbox.maps.CameraOptions;
import com.mapbox.maps.MapView;
import com.mapbox.maps.Style;
import com.mapbox.common.location.Location;
import com.mapbox.navigation.base.formatter.DistanceFormatterOptions;
import com.mapbox.navigation.base.options.NavigationOptions;
import com.mapbox.navigation.core.MapboxNavigation;
import com.mapbox.navigation.core.MapboxNavigationProvider;
import com.mapbox.navigation.core.trip.session.LocationMatcherResult;
import com.mapbox.navigation.core.trip.session.LocationObserver;
import com.mapbox.navigation.tripdata.speedlimit.api.MapboxSpeedInfoApi;
import com.mapbox.navigation.tripdata.speedlimit.model.PostedAndCurrentSpeedFormatter;
import com.mapbox.navigation.tripdata.speedlimit.model.SpeedInfoValue;

/** Real Mapbox map surface. Route search/guidance and matched posted-limit delivery are the next native layer. */
public final class MapboxNavigationActivity extends Activity {
    private static final int LOCATION_REQUEST = 50;
    private MapView mapView;
    private TextView status;
    private MapboxNavigation navigation;
    private final MapboxSpeedInfoApi speedInfoApi=new MapboxSpeedInfoApi();
    private DistanceFormatterOptions distanceOptions;
    private final LocationObserver locationObserver=new LocationObserver(){
        @Override public void onNewRawLocation(Location rawLocation) {}
        @Override public void onNewLocationMatcherResult(LocationMatcherResult result){
            Location location=result.getEnhancedLocation();
            mapView.getMapboxMap().setCamera(new CameraOptions.Builder().center(Point.fromLngLat(location.getLongitude(),location.getLatitude())).bearing(location.getBearing()).zoom(16.0).pitch(35.0).build());
            SpeedInfoValue info=speedInfoApi.updatePostedAndCurrentSpeed(result,distanceOptions,new PostedAndCurrentSpeedFormatter());
            if(info==null){status.setText("POSTED LIMIT  —   •   SPEED  —\nAWAITING ROAD MATCH");return;}
            Integer posted=info.getPostedSpeed();String unit=String.valueOf(info.getPostedSpeedUnit()).contains("MILE")?"MPH":"KM/H";
            status.setText("POSTED LIMIT  "+(posted==null?"—":posted)+" "+unit+"   •   SPEED  "+info.getCurrentSpeed()+" "+unit+"\nMAPBOX FREE DRIVE / ROAD MATCHED");
        }
    };

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (getString(R.string.mapbox_access_token).isEmpty()) {
            Toast.makeText(this,"Mapbox public token was not injected at build time.",Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        FrameLayout root=new FrameLayout(this);
        mapView=new MapView(this);
        mapView.getMapboxMap().setCamera(new CameraOptions.Builder().center(Point.fromLngLat(-81.9320,34.9496)).zoom(13.0).build());
        mapView.getMapboxMap().loadStyleUri(Style.DARK);
        root.addView(mapView,new FrameLayout.LayoutParams(-1,-1));

        LinearLayout top=new LinearLayout(this);top.setGravity(Gravity.CENTER_VERTICAL);top.setPadding(16,10,16,10);top.setBackgroundColor(Color.argb(225,8,11,13));
        Button close=new Button(this);close.setText("BACK TO COCKPIT");close.setOnClickListener(v->finish());
        TextView stateLabel=new TextView(this);stateLabel.setText("  MAPBOX / LIVE MAP");stateLabel.setTextColor(Color.rgb(255,171,84));stateLabel.setTextSize(12);
        top.addView(close);top.addView(stateLabel,new LinearLayout.LayoutParams(0,ViewGroup.LayoutParams.WRAP_CONTENT,1));
        FrameLayout.LayoutParams topParams=new FrameLayout.LayoutParams(-1,ViewGroup.LayoutParams.WRAP_CONTENT,Gravity.TOP);root.addView(top,topParams);

        TextView marker=new TextView(this);marker.setText("▲");marker.setTextSize(24);marker.setTextColor(Color.rgb(147,239,255));marker.setGravity(Gravity.CENTER);FrameLayout.LayoutParams markerParams=new FrameLayout.LayoutParams(70,70,Gravity.CENTER);root.addView(marker,markerParams);
        status=new TextView(this);status.setText("POSTED LIMIT  —   •   SPEED  —\nGPS MATCH REQUIRED");status.setTextColor(Color.rgb(147,239,255));status.setTextSize(12);status.setGravity(Gravity.CENTER);status.setPadding(12,12,12,12);status.setBackgroundColor(Color.argb(225,8,11,13));
        FrameLayout.LayoutParams bottom=new FrameLayout.LayoutParams(-1,ViewGroup.LayoutParams.WRAP_CONTENT,Gravity.BOTTOM);root.addView(status,bottom);
        setContentView(root);
        distanceOptions=new DistanceFormatterOptions.Builder(getApplicationContext()).build();
        if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},LOCATION_REQUEST);else startFreeDrive();
    }
    private void startFreeDrive(){
        navigation=MapboxNavigationProvider.isCreated()?MapboxNavigationProvider.retrieve():MapboxNavigationProvider.create(new NavigationOptions.Builder(getApplicationContext()).build());
        navigation.registerLocationObserver(locationObserver);navigation.startTripSession(false);status.setText("POSTED LIMIT  —   •   SPEED  —\nACQUIRING GPS / ROAD MATCH");
    }
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results){super.onRequestPermissionsResult(code,permissions,results);if(code!=LOCATION_REQUEST)return;if(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED)startFreeDrive();else Toast.makeText(this,"Location denied. The map remains usable, but vehicle position is unavailable.",Toast.LENGTH_LONG).show();}
    @Override protected void onDestroy(){if(navigation!=null){navigation.unregisterLocationObserver(locationObserver);navigation.stopTripSession();navigation=null;MapboxNavigationProvider.destroy();}mapView=null;super.onDestroy();}
}
