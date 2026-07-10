package com.rcoach.app;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;

/**
 * Routes phone launches to Capacitor. Wear devices cannot run the WebView shell.
 */
public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        if (getPackageManager().hasSystemFeature(PackageManager.FEATURE_WATCH)) {
            setContentView(R.layout.activity_wear_unsupported);
            return;
        }

        Intent forward = new Intent(this, CapacitorMainActivity.class);
        forward.setAction(getIntent().getAction());
        forward.setData(getIntent().getData());
        if (getIntent().getExtras() != null) {
            forward.putExtras(getIntent());
        }
        startActivity(forward);
        finish();
    }
}
