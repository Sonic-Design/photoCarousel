import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '20s', target: 25 },
    { duration: '20s', target: 50 },
    { duration: '20s', target: 75 },
    { duration: '20s', target: 100 },
    { duration: '20s', target: 125 },
    { duration: '20s', target: 100 },
    { duration: '20s', target: 75 },
    { duration: '20s', target: 50 },
    { duration: '20s', target: 25 },
    // { duration: '20s', target: 50 },
    // { duration: '20s', target: 100 },
    // { duration: '20s', target: 150 },
    // { duration: '20s', target: 200 },
    // { duration: '20s', target: 250 },
    // { duration: '20s', target: 200 },
    // { duration: '20s', target: 150 },
    // { duration: '20s', target: 100 },
    // { duration: '20s', target: 50 },
  ],
};

export default function () {
  const propertyId = Math.ceil(Math.random() * 10000000);
  let req1 = {
    method: 'GET',
    url: `http://localhost:3014/api/properties/${propertyId}/nearby`,
  };
  let req2 = {
    method: 'POST',
    url: 'http://localhost:3014/api/properties',
    body: {
      averageRating: '4.27',
      reviewCount: '139',
      bedCount: '2',
      houseType: '2LDK',
      nightlyPrice: '199.99',
      imageName: 'Getaway',
      imageDescription: 'Tropical island chain',
      imageUrl: 'path/to/image/location',
      hostId: '12345',
    },
    params: {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  };
  let responses = http.batch([req1, req2]);
  // let responses = http.batch([req1]);
  check(responses[0], {
    'status was 200': (res) => res.status == 200,
  }) || errorRate.add(1);
  check(responses[1], {
    'row was inserted': (res) => JSON.parse(res.body).rowCount == 1,
  }) || errorRate.add(1);
  sleep(1);
}
